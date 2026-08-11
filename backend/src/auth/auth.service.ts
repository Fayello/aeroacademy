import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import createLogger from '../common/logger';

const logger = createLogger('Auth');

const REFRESH_TOKEN_DAYS = 7;
const RESET_TOKEN_EXPIRY_MINUTES = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
    return token;
  }

  async refreshTokens(refreshToken: string) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) await this.prisma.refreshToken.delete({ where: { id: record.id } });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: record.id } });

    const user = record.user;
    const payload = { email: user.email, sub: user.id, role: user.role };
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async register(email: string, password: string, name?: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    return this.login(user);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async getFullProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        city: true,
        role: true,
        xp: true,
        rank: true,
        division: true,
        organizationId: true,
        teamId: true,
        createdAt: true,
        organization: { select: { id: true, name: true, type: true } },
        _count: { select: { achievements: true, progress: { where: { completed: true } }, labSubmissions: { where: { isCorrect: true } } } },
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const level = Math.floor(user.xp / 1000) + 1;
    const clearance = level > 10 ? 'EXPERT_STUDENT' : level > 5 ? 'CERTIFIED_L2' : 'STUDENT_L1';
    return { ...user, level, clearance };
  }

  async validateGoogleUser(profile: { googleId: string; email: string; name: string; avatar?: string }) {
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId },
        });
      }
      return user;
    }

    user = await this.prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
      },
    });

    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const refreshToken = await this.generateRefreshToken(user.id);
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        role: user.role,
      },
    };
  }

  async updateProfile(userId: string, data: { email?: string; name?: string; bio?: string; city?: string; organizationId?: string }) {
    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = {};
    if (data.email !== undefined) updateData.email = data.email;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.city !== undefined) updateData.city = data.city;

    if (data.organizationId) {
      const org = await this.prisma.organization.findUnique({ where: { id: data.organizationId } });
      if (org) updateData.organizationId = data.organizationId;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.passwordHash) throw new UnauthorizedException('Account uses Google sign-in. Cannot change password.');
    const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Incorrect password');
    const passwordHash = await bcrypt.hash(newPass, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });
  }

  async getOrganizations() {
    return this.prisma.organization.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silently return to prevent email enumeration

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_EXPIRY_MINUTES);

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // In production, send this token via email. For now, log at debug level only.
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    logger.debug(`Password reset URL for ${email}: ${resetUrl}`);
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { id: record.id } });
      throw new UnauthorizedException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    // Delete the used token and all other tokens for this user
    await this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

    return { message: 'Password has been reset successfully' };
  }
}
