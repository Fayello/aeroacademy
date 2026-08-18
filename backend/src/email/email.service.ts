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

  // ─── COURSE ENGAGEMENT EMAILS ──────────────────────────

  async sendCourseStarted(email: string, name: string | null, courseTitle: string, courseId: string) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    return this.send({
      to: email,
      from: 'info',
      subject: `Your journey begins: ${courseTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Course Started!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've started <strong>${courseTitle}</strong>. Great decision! Here's what to expect:</p>
    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0 0 8px;font-size:14px;"><strong>Your learning roadmap:</strong></p>
      <p style="color:#64748b;margin:0;font-size:13px;">- Start with the first module and work through each lesson</p>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">- Complete quizzes and labs to earn XP</p>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">- Earn your certification when you finish all modules</p>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="color:#64748b;margin:0 0 8px;font-size:13px;">Pro tip: Set aside 30 minutes daily for the best results</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Continue Learning</a>
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

  async sendCourseReminder(email: string, name: string | null, courseTitle: string, courseId: string, progressPct: number, daysInactive: number) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    const subject = daysInactive <= 7
      ? `Your course misses you — ${courseTitle}`
      : `Don't lose your progress — ${courseTitle} is waiting`;
    return this.send({
      to: email,
      from: 'info',
      subject,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">We Miss You!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">It's been ${daysInactive} days since you last worked on <strong>${courseTitle}</strong>.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
      <p style="color:#64748b;margin:0 0 8px;font-size:13px;">Your progress</p>
      <div style="background:#e2e8f0;border-radius:8px;height:8px;margin:0 auto;max-width:300px;">
        <div style="background:#6366f1;height:8px;border-radius:8px;width:${progressPct}%;"></div>
      </div>
      <p style="color:#334155;margin:12px 0 0;font-size:20px;font-weight:700;">${progressPct}% complete</p>
    </div>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You're just a few lessons away from making real progress. Pick up right where you left off.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Resume Course</a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Consistency is key — even 15 minutes a day adds up fast.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendMilestoneAchieved(email: string, name: string | null, courseTitle: string, courseId: string, milestone: string) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    return this.send({
      to: email,
      from: 'info',
      subject: `Milestone reached: ${milestone} — ${courseTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">${milestone}</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've hit a milestone in <strong>${courseTitle}</strong> — ${milestone}</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Keep going — you're building real skills that matter.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Keep Learning</a>
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

  async sendWeeklyDigest(
    email: string,
    name: string | null,
    stats: {
      lessonsCompleted: number;
      xpEarned: number;
      streakDays: number;
      coursesInProgress: { title: string; progressPct: number }[];
      leaderboardPosition?: number;
    },
  ) {
    const displayName = name || 'there';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard`;
    const coursesHtml = stats.coursesInProgress
      .map(
        (c) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9;">
          <div>
            <p style="color:#334155;font-size:14px;font-weight:600;margin:0;">${c.title}</p>
            <p style="color:#94a3b8;font-size:12px;margin:4px 0 0;">${c.progressPct}% complete</p>
          </div>
          <div style="width:48px;height:48px;">
            <svg viewBox="0 0 48 48" style="transform:rotate(-90deg);">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" stroke-width="4"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="#10b981" stroke-width="4"
                stroke-dasharray="${2 * Math.PI * 20}"
                stroke-dashoffset="${2 * Math.PI * 20 * (1 - c.progressPct / 100)}"
                stroke-linecap="round"/>
            </svg>
          </div>
        </div>`,
      )
      .join('');

    return this.send({
      to: email,
      from: 'info',
      subject: `Your Weekly Learning Report — ${stats.lessonsCompleted} lessons completed`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Your Weekly Report</h1>
    <p style="color:#c4b5fd;margin:8px 0 0;font-size:14px;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Here's what you accomplished this week:</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0;">
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#10b981;font-size:28px;font-weight:700;margin:0;">${stats.lessonsCompleted}</p>
        <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Lessons Completed</p>
      </div>
      <div style="background:#eff6ff;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#3b82f6;font-size:28px;font-weight:700;margin:0;">${stats.xpEarned}</p>
        <p style="color:#64748b;font-size:12px;margin:4px 0 0;">XP Earned</p>
      </div>
      <div style="background:#fefce8;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#f59e0b;font-size:28px;font-weight:700;margin:0;">${stats.streakDays}</p>
        <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Day Streak</p>
      </div>
      ${stats.leaderboardPosition ? `
      <div style="background:#faf5ff;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#a855f7;font-size:28px;font-weight:700;margin:0;">#${stats.leaderboardPosition}</p>
        <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Leaderboard</p>
      </div>` : ''}
    </div>

    ${stats.coursesInProgress.length > 0 ? `
    <p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Courses in Progress</p>
    <div style="margin-bottom:24px;">
      ${coursesHtml}
    </div>` : ''}

    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Continue Learning</a>
    </div>

    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Consistency builds expertise. See you next week!</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Cybersecurity Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendWelcomeDay1(email: string, name: string | null) {
    const displayName = name || 'there';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard`;
    const coursesUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses`;
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    return this.send({
      to: email,
      from: 'auth',
      subject: 'Welcome to XpertClass — Your journey starts here',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Welcome aboard, ${displayName}</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">Your cybersecurity training starts now</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've joined XpertClass — a platform built for hands-on cybersecurity training. Here's how to get started:</p>

    <div style="margin:24px 0;">
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#3b82f6;font-weight:700;font-size:14px;">1</span>
        </div>
        <div>
          <p style="color:#334155;font-size:14px;font-weight:600;margin:0;">Browse Courses</p>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Start with structured learning paths covering Linux, networking, and web security.</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:#f0fdf4;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#10b981;font-weight:700;font-size:14px;">2</span>
        </div>
        <div>
          <p style="color:#334155;font-size:14px;font-weight:600;margin:0;">Launch Labs</p>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Spin up isolated environments and practice real attack/defense scenarios.</p>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="width:32px;height:32px;background:#faf5ff;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <span style="color:#a855f7;font-weight:700;font-size:14px;">3</span>
        </div>
        <div>
          <p style="color:#334155;font-size:14px;font-weight:600;margin:0;">Earn XP & Level Up</p>
          <p style="color:#64748b;font-size:13px;margin:4px 0 0;">Complete lessons, capture flags, and climb the leaderboard.</p>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${coursesUrl}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Explore Courses</a>
    </div>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${labsUrl}" style="color:#10b981;font-size:14px;text-decoration:none;font-weight:500;">Or jump into a lab →</a>
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

  async sendWelcomeDay3(email: string, name: string | null) {
    const displayName = name || 'there';
    const coursesUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses`;
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    return this.send({
      to: email,
      from: 'auth',
      subject: 'Getting started — Your first hands-on challenge',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Ready for your first challenge?</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You signed up a couple of days ago — here are some recommended first steps:</p>

    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Recommended:</strong> Start with "Linux Fundamentals" — it builds the foundation for everything else on the platform.</p>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Quick wins to try:</p>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="color:#10b981;font-size:14px;">✓</span>
        <span style="color:#64748b;font-size:13px;">Complete your first lesson</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="color:#10b981;font-size:14px;">✓</span>
        <span style="color:#64748b;font-size:13px;">Launch a practice lab</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="color:#10b981;font-size:14px;">✓</span>
        <span style="color:#64748b;font-size:13px;">Capture your first flag</span>
      </div>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${coursesUrl}" style="background:#3b82f6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Learning</a>
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

  async sendWelcomeDay7(email: string, name: string | null, enrolledCount: number) {
    const displayName = name || 'there';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard`;
    const coursesUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses`;
    return this.send({
      to: email,
      from: 'auth',
      subject: 'Your first week — How did it go?',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">One week in — here's what's next</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've been with XpertClass for a week now. ${enrolledCount > 0 ? `You've enrolled in ${enrolledCount} course${enrolledCount > 1 ? 's' : ''} so far.` : "You haven't enrolled in any courses yet."}</p>

    <div style="background:#faf5ff;border-left:4px solid #8b5cf6;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Pro tip:</strong> Students who complete at least one lesson in their first week are 3× more likely to finish a full course.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${enrolledCount > 0 ? dashboardUrl : coursesUrl}" style="background:#8b5cf6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${enrolledCount > 0 ? 'Continue Learning' : 'Browse Courses'}</a>
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

  async sendEnrollmentNudge(email: string, name: string | null, courseTitle: string, courseId: string) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `You enrolled in ${courseTitle} — ready to start?`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Your course is waiting</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You enrolled in <strong>${courseTitle}</strong> but haven't started yet. Now is a great time to begin.</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Just one lesson takes about 15 minutes. Small steps lead to big skills.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Now</a>
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

  async sendPausedCourseNudge(email: string, name: string | null, courseTitle: string, courseId: string, progressPct: number, daysInactive: number) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `Pick up where you left off — ${courseTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">You're ${progressPct}% through — don't stop now</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You were making great progress in <strong>${courseTitle}</strong> — ${progressPct}% complete. It's been ${daysInactive} days since your last lesson.</p>
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Consistency matters more than speed. Even one lesson today keeps your momentum going.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#6366f1;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Resume Course</a>
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

  async sendFirstLabLaunched(email: string, name: string | null) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    return this.send({
      to: email,
      from: 'labs',
      subject: "First lab launched - you're in the arena",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Lab launched!</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">You've entered the arena</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You just launched your first hands-on lab — that's how real skills are built.</p>
    <div style="background:#f0fdf4;border-left:4px solid #10b981;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>What's next:</strong> Explore the environment, look for vulnerabilities, and capture flags to earn XP.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${labsUrl}" style="background:#10b981;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View My Labs</a>
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

  async sendFirstFlagCaptured(email: string, name: string | null, labTitle: string, points: number) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `First flag captured — +${points} XP`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">First Blood</h1>
    <p style="color:#fef3c7;margin:8px 0 0;font-size:14px;">You captured your first flag</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You just captured your first flag in <strong>${labTitle}</strong> — earning <strong>+${points} XP</strong>.</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">This is how attackers think — find the weakness, prove the exploit, claim the flag. Keep going.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${labsUrl}" style="background:#f59e0b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Capture More Flags</a>
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

  async sendLevelUp(email: string, name: string | null, newLevel: number) {
    const displayName = name || 'there';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard`;
    const levelNames: Record<number, string> = {
      2: 'Apprentice',
      3: 'Operative',
      4: 'Specialist',
      5: 'Expert',
      6: 'Master',
      7: 'Elite',
      8: 'Legendary',
      9: 'Grandmaster',
      10: 'Transcendent',
    };
    const title = levelNames[newLevel] || `Level ${newLevel}`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `Level up — You're now ${title}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:24px;">Level ${newLevel} — ${title}</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've reached <strong>Level ${newLevel} — ${title}</strong>. Your skills are growing.</p>
    <div style="background:#faf5ff;border-left:4px solid #8b5cf6;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">New labs and challenges unlock at higher levels. Keep training to access harder content.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="background:#8b5cf6;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Dashboard</a>
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

  async sendLessonCompleted(email: string, name: string | null, lessonTitle: string, courseTitle: string, courseId: string, progressPct: number) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `Lesson complete: ${lessonTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,#10b981,#059669);padding:24px;text-align:center;">
    <p style="color:#fff;margin:0;font-size:32px;">✓</p>
    <h1 style="color:#fff;margin:8px 0 0;font-size:20px;">Lesson Complete</h1>
  </div>
  <div style="padding:28px;">
    <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">You completed <strong>${lessonTitle}</strong> in <strong>${courseTitle}</strong>.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="color:#334155;font-size:14px;margin:0 0 8px;">Course Progress</p>
      <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
        <div style="background:#10b981;height:100%;width:${progressPct}%;border-radius:4px;"></div>
      </div>
      <p style="color:#64748b;font-size:12px;margin:8px 0 0;">${progressPct}% complete</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${courseUrl}" style="background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Continue Course</a>
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
