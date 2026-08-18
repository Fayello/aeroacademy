import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export type EmailSender = 'auth' | 'labs' | 'noreply' | 'info';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: EmailSender;
}

const SENDER_MAP: Record<EmailSender, { name: string; address: string }> = {
  auth: { name: 'XpertClass Auth', address: 'auth@xpertclass.academy' },
  labs: { name: 'XpertClass Labs', address: 'labs@xpertclass.academy' },
  noreply: { name: 'XpertClass System', address: 'noreply@xpertclass.academy' },
  info: { name: 'XpertClass', address: 'info@xpertclass.academy' },
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private enabled = false;

  async onModuleInit() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — emails will be logged only');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    try {
      await this.transporter.verify();
      this.enabled = true;
      this.logger.log('SMTP connection verified');
    } catch (err) {
      this.logger.error(`SMTP verification failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    const sender = SENDER_MAP[options.from || 'noreply'];

    if (!this.enabled) {
      this.logger.debug(`[EMAIL LOG] To: ${options.to} | From: ${sender.address} | Subject: ${options.subject}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${sender.name}" <${sender.address}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Email send failed: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  // ─── AUTH EMAILS ───────────────────────────────────────

  async sendWelcome(email: string, name: string | null) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'auth',
      subject: 'Welcome to XpertClass — Your Cybersecurity Journey Begins',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Welcome to XpertClass</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Your account is ready. Start exploring hands-on cybersecurity labs, earn XP, and climb the leaderboard.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/login" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Log In to XpertClass</a>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">If you didn't create this account, please ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendOtpVerification(email: string, name: string | null, code: string) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'auth',
      subject: `Verify Your XpertClass Account — Code: ${code}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Verify Your Account</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Use the code below to verify your email address and activate your XpertClass account.</p>
    <div style="text-align:center;margin:28px 0;">
      <div style="background:#f1f5f9;border-radius:12px;padding:20px 40px;display:inline-block;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#6366f1;font-family:monospace;">${code}</span>
      </div>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">This code expires in 10 minutes. If you didn't create this account, please ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendPasswordResetOtp(email: string, name: string | null, code: string) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'auth',
      subject: `Reset Your XpertClass Password — Code: ${code}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Reset Password</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Use the code below to reset your XpertClass password.</p>
    <div style="text-align:center;margin:28px 0;">
      <div style="background:#fefce8;border-radius:12px;padding:20px 40px;display:inline-block;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#d97706;font-family:monospace;">${code}</span>
      </div>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/reset-password?token=${resetToken}`;
    return this.send({
      to: email,
      from: 'auth',
      subject: 'Reset Your XpertClass Password',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Password Reset</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">We received a request to reset your password.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  // ─── LAB EMAILS ────────────────────────────────────────

  async sendLabStarted(email: string, name: string | null, labTitle: string, expiresAt: Date) {
    const displayName = name || 'there';
    const expiry = expiresAt.toLocaleString('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' });
    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab Ready: ${labTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Lab Environment Ready</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Your lab <strong>${labTitle}</strong> is now running.</p>
    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Expires:</strong> ${expiry} (UTC)</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Open Lab</a>
    </div>
    <p style="color:#64748b;font-size:14px;line-height:1.6;">Save your work before the lab expires. Stopping the lab early frees resources for other students.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendLabExpiring(email: string, name: string | null, labTitle: string, minutesLeft: number) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab Expiring Soon: ${labTitle} (${minutesLeft} min)`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Lab Expiring Soon</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Your lab <strong>${labTitle}</strong> will expire in <strong>${minutesLeft} minutes</strong>.</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Save your progress and notes before the environment is stopped.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Back to Labs</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendLabExpired(email: string, name: string | null, labTitle: string) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab Ended: ${labTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#64748b,#475569);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Lab Session Ended</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Your lab <strong>${labTitle}</strong> has expired and the environment has been stopped.</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Any unsaved work in the lab has been lost.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Another Lab</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  // ─── SYSTEM EMAILS ─────────────────────────────────────

  async sendAccountLocked(email: string, attempts: number) {
    return this.send({
      to: email,
      from: 'noreply',
      subject: 'XpertClass — Account Temporarily Locked',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Account Temporarily Locked</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">We detected ${attempts} failed login attempts on your XpertClass account.</p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Your account has been temporarily locked for 15 minutes to protect your security.</p>
    </div>
    <p style="color:#334155;font-size:16px;line-height:1.6;">If this wasn't you, please reset your password immediately.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/forgot-password" style="background:#ef4444;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  // ─── PRODUCT EMAILS ────────────────────────────────────

  async sendCourseEnrolled(email: string, name: string | null, courseTitle: string) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'info',
      subject: `You're Enrolled: ${courseTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Course Enrolled</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've been enrolled in <strong>${courseTitle}</strong>. Start learning at your own pace.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Learning</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendCertificationEarned(email: string, name: string | null, certTitle: string) {
    const displayName = name || 'there';
    return this.send({
      to: email,
      from: 'info',
      subject: `Certificate Earned: ${certTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Certificate Earned</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Congratulations! You've earned the <strong>${certTitle}</strong> certificate.</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Download your certificate from your dashboard.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/certifications" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Certificate</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }
}
