import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private rateLimitMap = new Map<string, number>();

  constructor(private prisma: PrismaService) {}

  generate(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async create(
    email: string,
    purpose: string = 'email_verification',
  ): Promise<string> {
    const now = Date.now();
    const lastRequest = this.rateLimitMap.get(`${email}:${purpose}`);
    if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
      this.logger.warn(`Rate limited OTP request for ${email} (${purpose})`);
      return '';
    }
    this.rateLimitMap.set(`${email}:${purpose}`, now);

    await this.prisma.otpVerification.deleteMany({
      where: { email, purpose },
    });

    const code = this.generate();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpVerification.create({
      data: { email, code, purpose, expiresAt },
    });

    this.logger.log(`OTP created for ${email} (${purpose}): ${code}`);
    return code;
  }

  async verify(
    email: string,
    code: string,
    purpose: string = 'email_verification',
  ): Promise<boolean> {
    const record = await this.prisma.otpVerification.findFirst({
      where: { email, purpose },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) return false;

    if (record.expiresAt < new Date()) {
      await this.prisma.otpVerification.delete({ where: { id: record.id } });
      return false;
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await this.prisma.otpVerification.deleteMany({
        where: { email, purpose },
      });
      return false;
    }

    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (record.code !== code) return false;

    await this.prisma.otpVerification.deleteMany({ where: { email, purpose } });
    return true;
  }

  async cleanup() {
    await this.prisma.otpVerification.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
