import { Controller, Post, Body, Get, UseGuards, Request, UnauthorizedException, Patch, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';
import * as https from 'https';
import { Throttle } from '@nestjs/throttler';
import createLogger from '../common/logger';

const logger = createLogger('Auth');

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto.email, registerDto.password, registerDto.name);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid security credentials');
    }
    return this.authService.login(user);
  }

  @Get('google')
  async googleAuth(@Query('state') state: string, @Res() res: any) {
    // Redirect to Google with state passed through
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4000'}/auth/google/callback`;
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state || ''}&access_type=offline`;
    res.redirect(url);
  }

  @Get('google/callback')
  async googleAuthCallback(@Query() query: any, @Res() res: any) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    try {
      if (query.error) {
        res.writeHead(302, { Location: `${frontendUrl}/login?error=google_denied` });
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

      const { access_token, refresh_token } = await this.authService.login(user);

      // Pass state back to frontend for validation
      const stateParam = query.state ? `&state=${query.state}` : '';
      res.writeHead(302, { Location: `${frontendUrl}/dashboard?token=${access_token}&refresh_token=${refresh_token}${stateParam}` });
      res.end();
    } catch (err) {
      logger.error(`Callback error: ${err.message}`);
      res.writeHead(302, { Location: `${frontendUrl}/login?error=google_auth_failed` });
      res.end();
    }
  }

  private exchangeCodeForToken(code: string): Promise<{ access_token: string; id_token: string }> {
    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:4000'}/auth/google/callback`,
        grant_type: 'authorization_code',
      }).toString();

      const req = https.request('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            if (parsed.error) reject(new Error(parsed.error_description || parsed.error));
            else resolve(parsed);
          } catch (e) { reject(e); }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private getUserProfile(accessToken: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req) {
    return this.authService.getFullProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto.oldPassword, changePasswordDto.newPassword);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('organizations')
  async getOrganizations() {
    return this.authService.getOrganizations();
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async forgotPassword(@Body('email') email: string) {
    // Always return success to prevent email enumeration
    if (email) {
      await this.authService.forgotPassword(email).catch(() => {});
    }
    return { message: 'If an account exists with that email, a recovery link has been sent.' };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body('token') token: string, @Body('newPassword') newPassword: string) {
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(@Body('refresh_token') refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async logout(@Body('refresh_token') refreshToken: string) {
    if (refreshToken) await this.authService.logout(refreshToken);
    return { message: 'Logged out' };
  }
}
