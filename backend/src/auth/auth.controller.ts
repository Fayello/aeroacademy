import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  UnauthorizedException,
  Patch,
  Res,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { AuthGuard } from '@nestjs/passport';
import { EmailService } from '../email/email.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import * as https from 'https';
import type { Request as ExpressRequest, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import createLogger from '../common/logger';
import type { RequestWithUser } from '../common/request-with-user';

const logger = createLogger('Auth');
const ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface GoogleCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

@ApiTags('auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  private getCookieValue(req: ExpressRequest, name: string): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [key, ...valueParts] = cookie.trim().split('=');
      if (key === name) return decodeURIComponent(valueParts.join('='));
    }

    return null;
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const secure = process.env.NODE_ENV === 'production';
    const common = {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...common,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
    });
    res.cookie('refresh_token', refreshToken, {
      ...common,
      maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
    });
    res.cookie('token', accessToken, {
      ...common,
      httpOnly: false,
      maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
    });
  }

  private clearAuthCookies(res: Response) {
    const secure = process.env.NODE_ENV === 'production';
    const common = {
      secure,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.clearCookie('access_token', common);
    res.clearCookie('refresh_token', common);
    res.clearCookie('token', common);
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('AUTH_REGISTER')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
      registerDto.timezone,
    );
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('AUTH_VERIFY_EMAIL')
  async verifyEmail(
    @Body('token') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!token) {
      throw new UnauthorizedException('Verification token is required');
    }
    const result = await this.authService.verifyEmailByToken(token);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('resend-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Audit('AUTH_RESEND_OTP')
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('AUTH_LOGIN')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid security credentials');
    }
    const result = await this.authService.login(user);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Get('google')
  googleAuth(@Query('state') state: string, @Res() res: Response) {
    // Redirect to Google with state passed through
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/auth/google/callback`;
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state || '')}&access_type=offline`;
    res.redirect(url);
  }

  @Get('google/callback')
  async googleAuthCallback(
    @Query() query: GoogleCallbackQuery,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      if (query.error) {
        res.writeHead(302, {
          Location: `${frontendUrl}/login?error=google_denied`,
        });
        res.end();
        return;
      }

      if (!query.code) {
        res.writeHead(302, { Location: `${frontendUrl}/login?error=no_code` });
        res.end();
        return;
      }

      const tokenData = await this.exchangeCodeForToken(query.code);
      const profile = await this.getUserProfile(tokenData.access_token);

      const result = await this.authService.validateGoogleUser({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
      });

      if (result.isNewUser || !result.user.emailVerified) {
        const code = await this.otpService.create(profile.email, 'email_verification');
        if (code) {
          this.emailService.sendOtpVerification(profile.email, profile.name, code).catch(() => {});
        }
        res.writeHead(302, {
          Location: `${frontendUrl}/verify-email?email=${encodeURIComponent(profile.email)}`,
        });
        res.end();
        return;
      }

      const { access_token, refresh_token } =
        await this.authService.login(result.user);
      this.setAuthCookies(res, access_token, refresh_token);

      res.writeHead(302, {
        Location: `${frontendUrl}/dashboard`,
      });
      res.end();
    } catch (err: unknown) {
      logger.error(
        `Callback error: ${err instanceof Error ? err.message : String(err)}`,
      );
      res.writeHead(302, {
        Location: `${frontendUrl}/login?error=google_auth_failed`,
      });
      res.end();
    }
  }

  private exchangeCodeForToken(
    code: string,
  ): Promise<{ access_token: string; id_token: string }> {
    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/v1/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString();

      const req = https.request(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body) as {
                error?: string;
                error_description?: string;
                access_token?: string;
                id_token?: string;
              };
              if (parsed.error) {
                reject(new Error(parsed.error_description || parsed.error));
              } else if (parsed.access_token && parsed.id_token) {
                resolve({
                  access_token: parsed.access_token,
                  id_token: parsed.id_token,
                });
              } else {
                reject(new Error('Invalid OAuth token response'));
              }
            } catch (e: unknown) {
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          });
        },
      );

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    return new Promise((resolve, reject) => {
      const req = https.request(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              resolve(JSON.parse(body) as GoogleUserProfile);
            } catch (e: unknown) {
              reject(e instanceof Error ? e : new Error(String(e)));
            }
          });
        },
      );

      req.on('error', reject);
      req.end();
    });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Post('referral')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('AUTH_REFERRAL')
  async applyReferral(
    @Request() req: RequestWithUser,
    @Body('code') code: string,
  ) {
    if (!code) {
      throw new UnauthorizedException('Referral code is required');
    }
    return this.authService.applyReferral(req.user.id, code);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('me/referrals')
  async getMyReferrals(@Request() req: RequestWithUser) {
    return this.authService.getReferrals(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getFullProfile(req.user.id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('users/:id/profile')
  async getPublicProfile(@Param('id') id: string) {
    return this.authService.getPublicProfile(id);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Patch('email-preferences')
  async updateEmailPreferences(
    @Request() req: RequestWithUser,
    @Body() body: { preferences: Record<string, boolean> },
  ) {
    return this.authService.updateEmailPreferences(req.user.id, body.preferences);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Patch('avatar')
  async updateAvatar(
    @Request() req: RequestWithUser,
    @Body() body: { avatarUrl: string | null },
  ) {
    return this.authService.updateAvatar(req.user.id, body.avatarUrl);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Patch('pinned-badges')
  async updatePinnedBadges(
    @Request() req: RequestWithUser,
    @Body() body: { badgeIds: string[] },
  ) {
    return this.authService.updatePinnedBadges(req.user.id, body.badgeIds);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('AUTH_CHANGE_PASSWORD')
  async changePassword(
    @Request() req: RequestWithUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Get('organizations')
  async getOrganizations() {
    return this.authService.getOrganizations();
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Audit('AUTH_FORGOT_PASSWORD')
  async forgotPassword(@Body('email') email: string) {
    if (email) {
      await this.authService.forgotPassword(email).catch(() => {});
    }
    return {
      message:
        'If an account exists with that email, a verification code has been sent.',
    };
  }

  @Post('reset-password-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('AUTH_RESET_PASSWORD_OTP')
  async resetPasswordOtp(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('newPassword') newPassword: string,
  ) {
    if (!email || !code || !newPassword) {
      throw new UnauthorizedException('Email, verification code, and new password are required');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new UnauthorizedException('Password must contain uppercase, lowercase, and a number');
    }
    return this.authService.resetPasswordWithOtp(email, code, newPassword);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('AUTH_RESET_PASSWORD')
  async resetPassword(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new UnauthorizedException('Password must contain uppercase, lowercase, and a number');
    }
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Body('refresh_token') refreshToken: string,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = refreshToken || this.getCookieValue(req, 'refresh_token');
    if (!token)
      throw new UnauthorizedException('Refresh token required');
    const result = await this.authService.refreshTokens(token);
    this.setAuthCookies(res, result.access_token, result.refresh_token);
    return result;
  }

  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('AUTH_LOGOUT')
  async logout(
    @Body('refresh_token') refreshToken: string,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = refreshToken || this.getCookieValue(req, 'refresh_token');
    if (token) await this.authService.logout(token);
    this.clearAuthCookies(res);
    return { message: 'Logged out' };
  }
}
