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
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import * as https from 'https';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Audit } from '../common/audit.decorator';
import createLogger from '../common/logger';
import type { RequestWithUser } from '../common/request-with-user';

const logger = createLogger('Auth');

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
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Audit('AUTH_REGISTER')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.name,
    );
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('AUTH_LOGIN')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid security credentials');
    }
    return this.authService.login(user);
  }

  @Get('google')
  googleAuth(@Query('state') state: string, @Res() res: Response) {
    // Redirect to Google with state passed through
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4000'}/auth/google/callback`;
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

      const user = await this.authService.validateGoogleUser({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
      });

      const { access_token, refresh_token } =
        await this.authService.login(user);

      // Pass state back to frontend for validation
      const stateParam = query.state ? `&state=${encodeURIComponent(query.state)}` : '';
      const isProduction = process.env.NODE_ENV === 'production';
      const secureFlag = isProduction ? '; Secure' : '';
      res.writeHead(302, {
        'Set-Cookie': [
          `token=${access_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secureFlag}`,
          `refresh_token=${refresh_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secureFlag}`,
        ],
        Location: `${frontendUrl}/dashboard${stateParam}`,
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
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:4000'}/auth/google/callback`,
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
  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    return this.authService.getFullProfile(req.user.id);
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
    // Always return success to prevent email enumeration
    if (email) {
      await this.authService.forgotPassword(email).catch(() => {});
    }
    return {
      message:
        'If an account exists with that email, a recovery link has been sent.',
    };
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
  async refresh(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token required');
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Audit('AUTH_LOGOUT')
  async logout(@Body('refresh_token') refreshToken: string) {
    if (refreshToken) await this.authService.logout(refreshToken);
    return { message: 'Logged out' };
  }
}
