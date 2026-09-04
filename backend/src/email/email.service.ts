import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SubmitInquiryDto } from './dto/submit-inquiry.dto';
import { SubmitCommunityApplicationDto } from './dto/submit-community-application.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailTemplateService } from './email-template.service';

export type EmailSender = 'auth' | 'labs' | 'noreply' | 'info';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: EmailTemplateService,
  ) {}

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
      this.logger.error(
        `SMTP verification failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async send(options: SendEmailOptions): Promise<boolean> {
    const sender = SENDER_MAP[options.from || 'noreply'];

    if (!this.enabled) {
      this.logger.debug(
        `[EMAIL LOG] To: ${options.to} | From: ${sender.address} | Subject: ${options.subject}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: `"${sender.name}" <${sender.address}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
      return true;
    } catch (err) {
      this.logger.error(
        `Email send failed: ${err instanceof Error ? err.message : err}`,
      );
      return false;
    }
  }

  async sendInstitutionInquiry(inquiry: SubmitInquiryDto) {
    const inquiryLabel =
      inquiry.inquiryType === 'university' ? 'University' : 'Enterprise';
    const submittedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const email = this.templates.render({
      eyebrow: 'New institutional inquiry',
      title: `${inquiryLabel} contact request`,
      subtitle:
        'A visitor requested a conversation with XpertClass from the get-started page.',
      fields: [
        { label: 'Inquiry type', value: inquiryLabel },
        { label: 'Name', value: inquiry.name },
        { label: 'Email', value: inquiry.email },
        { label: 'Organization', value: inquiry.organization },
        { label: 'Role', value: inquiry.role },
        { label: 'Team size', value: inquiry.teamSize },
        { label: 'Phone', value: inquiry.phone },
        { label: 'Submitted', value: submittedAt },
      ],
      panels: [{ title: 'Message', body: inquiry.message }],
      action: { label: 'Reply by email', href: `mailto:${inquiry.email}` },
      footerNote:
        'This inquiry was captured from the public XpertClass institutional intake flow.',
    });

    return this.send({
      to: 'contact@xpertclass.academy',
      from: 'info',
      subject: `${inquiryLabel} inquiry from ${inquiry.organization}`,
      ...email,
    });
  }

  async createInquiryRecord(inquiry: SubmitInquiryDto) {
    return this.prisma.institutionalInquiry.create({
      data: {
        inquiryType:
          inquiry.inquiryType === 'university' ? 'UNIVERSITY' : 'ENTERPRISE',
        name: inquiry.name,
        email: inquiry.email,
        organization: inquiry.organization,
        role: inquiry.role || null,
        teamSize: inquiry.teamSize || null,
        phone: inquiry.phone || null,
        message: inquiry.message,
        sourcePage: inquiry.sourcePage || '/get-started',
      },
      select: {
        id: true,
        inquiryType: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async sendInquiryAcknowledgement(
    email: string,
    name: string,
    inquiryType: 'university' | 'enterprise',
  ) {
    const displayName = name || 'there';
    const inquiryLabel =
      inquiryType === 'university' ? 'university' : 'enterprise';
    const email = this.templates.render({
      eyebrow: 'Inquiry received',
      title: 'We received your request',
      subtitle: 'Your message is now with the XpertClass team.',
      intro: `Hi ${displayName},`,
      body: [
        `We received your ${inquiryLabel} inquiry and shared it with the right team.`,
        'We will review your goals, context, and timeline before replying to this email address.',
      ],
      panels: [
        {
          title: 'What happens next',
          body:
            'A team member will follow up with the most relevant next step for your institution or organization.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Visit XpertClass',
        href: process.env.FRONTEND_URL || 'https://xpertclass.academy',
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'We received your XpertClass inquiry',
      ...email,
    });
  }

  async createCommunityProgramApplicationRecord(
    application: SubmitCommunityApplicationDto,
  ) {
    return this.prisma.communityProgramApplication.create({
      data: {
        programType:
          application.programType === 'ambassador' ? 'AMBASSADOR' : 'VOLUNTEER',
        name: application.name,
        email: application.email,
        city: application.city || null,
        organization: application.organization || null,
        role: application.role || null,
        experience: application.experience || null,
        interests: application.interests || [],
        contribution: application.contribution,
        availability: application.availability || null,
        linkedinUrl: application.linkedinUrl || null,
        portfolioUrl: application.portfolioUrl || null,
        sourcePage: application.sourcePage || '/community',
      },
      select: {
        id: true,
        programType: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async sendCommunityProgramApplication(
    application: SubmitCommunityApplicationDto,
  ) {
    const programLabel =
      application.programType === 'ambassador'
        ? 'Brand ambassador'
        : 'Volunteer';
    const submittedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const email = this.templates.render({
      eyebrow: 'Community program application',
      title: `${programLabel} application`,
      subtitle:
        'A new applicant wants to support the XpertClass community program.',
      fields: [
        { label: 'Program', value: programLabel },
        { label: 'Name', value: application.name },
        { label: 'Email', value: application.email },
        { label: 'City', value: application.city },
        { label: 'Organization', value: application.organization },
        { label: 'Role', value: application.role },
        { label: 'Experience', value: application.experience },
        { label: 'Availability', value: application.availability },
        { label: 'LinkedIn', value: application.linkedinUrl },
        { label: 'Portfolio', value: application.portfolioUrl },
        { label: 'Source page', value: application.sourcePage || '/community' },
        { label: 'Submitted', value: submittedAt },
      ],
      panels: [
        {
          title: 'Interests',
          body: (application.interests || []).join(', ') || 'Not provided',
        },
        { title: 'Contribution plan', body: application.contribution },
      ],
      action: { label: 'Reply to applicant', href: `mailto:${application.email}` },
      footerNote:
        'Review this applicant from the admin community programs dashboard before making a decision.',
    });

    return this.send({
      to: 'contact@xpertclass.academy',
      from: 'info',
      subject: `${programLabel} application from ${application.name}`,
      ...email,
    });
  }

  async sendCommunityProgramAcknowledgement(
    email: string,
    name: string,
    programType: 'ambassador' | 'volunteer',
  ) {
    const displayName = name || 'there';
    const programLabel =
      programType === 'ambassador' ? 'brand ambassador' : 'volunteer';
    const email = this.templates.render({
      eyebrow: 'Application received',
      title: 'Your community application is in review',
      subtitle: 'Thank you for offering to help grow XpertClass with us.',
      intro: `Hi ${displayName},`,
      body: [
        `We received your ${programLabel} application and shared it with our community team.`,
        'We will review your experience, availability, and contribution plan before replying to this email address.',
      ],
      panels: [
        {
          title: 'Selection focus',
          body:
            'We look for reliable contributors who can support learners clearly, represent the platform well, and help communities move from interest to practice.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Explore community programs',
        href: `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/community`,
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'We received your XpertClass community application',
      ...email,
    });
  }

  // ─── AUTH EMAILS ───────────────────────────────────────

  async sendWelcome(email: string, name: string | null) {
    const displayName = name || 'there';
    const loginUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/login`;
    const email = this.templates.render({
      eyebrow: 'Welcome to XpertClass',
      title: `Welcome, ${displayName}`,
      subtitle: 'Your account is ready. Your practical training record starts now.',
      body: [
        'Start with a structured path, launch hands-on labs, and build evidence you can show to instructors, recruiters, and employers.',
        'Your dashboard keeps your progress, XP, certificates, and readiness signals in one place.',
      ],
      panels: [
        {
          title: 'Recommended first step',
          body:
            'Complete onboarding so the platform can guide you toward the right courses and labs.',
          tone: 'success',
        },
      ],
      action: { label: 'Log in to XpertClass', href: loginUrl },
      footerNote:
        'If you did not create this account, you can ignore this email.',
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'Welcome to XpertClass - Your training journey begins',
      ...email,
    });
  }

  async sendOtpVerification(email: string, name: string | null, code: string) {
    const displayName = name || 'there';
    const email = this.templates.render({
      eyebrow: 'Account verification',
      title: 'Verify your XpertClass account',
      subtitle: 'Use this code to activate your account.',
      intro: `Hi ${displayName},`,
      body: [
        'Enter the verification code below to confirm your email address and continue setting up your account.',
      ],
      code,
      panels: [
        {
          title: 'Expires in 10 minutes',
          body:
            'For your security, this verification code can only be used for a short time.',
          tone: 'security',
        },
      ],
      footerNote:
        'If you did not create this account, you can ignore this email.',
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: `Verify your XpertClass account - Code: ${code}`,
      ...email,
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string | null,
    token: string,
  ) {
    const displayName = name || 'there';
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/verify?token=${token}`;
    const email = this.templates.render({
      eyebrow: 'Email verification',
      title: 'Verify your email address',
      subtitle: 'Confirm this address to activate your XpertClass account.',
      intro: `Hi ${displayName},`,
      body: [
        'Click the button below to verify your email address and continue into your learner dashboard.',
      ],
      action: { label: 'Verify email address', href: verifyUrl },
      panels: [
        {
          title: 'Link expiry',
          body: 'This verification link expires in 24 hours.',
          tone: 'security',
        },
      ],
      footerNote:
        'If you did not create this account, you can ignore this email.',
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Verify your XpertClass email address',
      ...email,
    });
  }

  async sendPasswordResetOtp(email: string, name: string | null, code: string) {
    const displayName = name || 'there';
    const email = this.templates.render({
      eyebrow: 'Password reset',
      title: 'Reset your XpertClass password',
      subtitle: 'Use this code to continue your password reset.',
      intro: `Hi ${displayName},`,
      body: ['Enter the code below to reset your XpertClass password.'],
      code,
      panels: [
        {
          title: 'Expires in 10 minutes',
          body:
            'If you did not request a password reset, you can ignore this email and your password will stay unchanged.',
          tone: 'warning',
        },
      ],
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: `Reset your XpertClass password - Code: ${code}`,
      ...email,
    });
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/reset-password?token=${resetToken}`;
    const email = this.templates.render({
      eyebrow: 'Password reset',
      title: 'Reset your password',
      subtitle: 'We received a request to reset your XpertClass password.',
      body: [
        'Use the secure link below to choose a new password and regain access to your account.',
      ],
      action: { label: 'Reset password', href: resetUrl },
      panels: [
        {
          title: 'Expires in 30 minutes',
          body:
            'If you did not request this reset, ignore this email and consider changing your password from settings.',
          tone: 'warning',
        },
      ],
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Reset your XpertClass password',
      ...email,
    });
  }

  // ─── LAB EMAILS ────────────────────────────────────────

  async sendLabStarted(
    email: string,
    name: string | null,
    labTitle: string,
    expiresAt: Date,
  ) {
    const displayName = name || 'there';
    const expiry = expiresAt.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    const email = this.templates.render({
      eyebrow: 'Lab environment ready',
      title: 'Your lab is running',
      subtitle: labTitle,
      intro: `Hi ${displayName},`,
      body: [
        'Your isolated lab environment is ready. Open the lab, complete the objectives, and save any notes before the session ends.',
      ],
      fields: [
        { label: 'Lab', value: labTitle },
        { label: 'Expires', value: `${expiry} UTC` },
      ],
      panels: [
        {
          title: 'Resource note',
          body:
            'Stopping the lab when you are done frees capacity for other learners.',
          tone: 'success',
        },
      ],
      action: { label: 'Open lab', href: labsUrl },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab ready: ${labTitle}`,
      ...email,
    });
  }

  async sendLabExpiring(
    email: string,
    name: string | null,
    labTitle: string,
    minutesLeft: number,
  ) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    const email = this.templates.render({
      eyebrow: 'Lab session expiring',
      title: 'Your lab will expire soon',
      subtitle: labTitle,
      intro: `Hi ${displayName},`,
      body: [
        `Your lab session will expire in ${minutesLeft} minutes. Save your progress, notes, and any commands you still need.`,
      ],
      panels: [
        {
          title: 'Before it stops',
          body:
            'Submit pending flags and capture anything you need from the terminal before the environment shuts down.',
          tone: 'warning',
        },
      ],
      action: { label: 'Return to labs', href: labsUrl },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab expiring soon: ${labTitle} (${minutesLeft} min)`,
      ...email,
    });
  }

  async sendLabExpired(email: string, name: string | null, labTitle: string) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    const email = this.templates.render({
      eyebrow: 'Lab session ended',
      title: 'Your lab has ended',
      subtitle: labTitle,
      intro: `Hi ${displayName},`,
      body: [
        'Your lab environment has expired and the session has been stopped.',
        'Any work that was not saved outside the lab environment may no longer be available.',
      ],
      action: { label: 'Start another lab', href: labsUrl },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab ended: ${labTitle}`,
      ...email,
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Account Temporarily Locked</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">We detected ${attempts} failed login attempts on your XpertClass account.</p>
    <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Your account has been temporarily locked for 15 minutes to protect your security.</p>
    </div>
    <p style="color:#334155;font-size:16px;line-height:1.6;">If this wasn't you, please reset your password immediately.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/forgot-password" style="background:#0F203A;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  // ─── PRODUCT EMAILS ────────────────────────────────────

  async sendCourseEnrolled(
    email: string,
    name: string | null,
    courseTitle: string,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Course Enrolled</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've been enrolled in <strong>${courseTitle}</strong>. Start learning at your own pace.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Learning</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendCertificationEarned(
    email: string,
    name: string | null,
    certTitle: string,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Certificate Earned</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Congratulations! You've earned the <strong>${certTitle}</strong> certificate.</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Download your certificate from your dashboard.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/certifications" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Certificate</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  // ─── COURSE ENGAGEMENT EMAILS ──────────────────────────

  async sendCourseStarted(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
  ) {
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
  <div style="background:linear-gradient(135deg,#229C62,#229C62);padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Course Started!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've started <strong>${courseTitle}</strong>. Great decision! Here's what to expect:</p>
    <div style="background:#f0fdf4;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0 0 8px;font-size:14px;"><strong>Your learning roadmap:</strong></p>
      <p style="color:#64748b;margin:0;font-size:13px;">- Start with the first module and work through each lesson</p>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">- Complete quizzes and labs to earn XP</p>
      <p style="color:#64748b;margin:4px 0 0;font-size:13px;">- Earn your certification when you finish all modules</p>
    </div>
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="color:#64748b;margin:0 0 8px;font-size:13px;">Pro tip: Set aside 30 minutes daily for the best results</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Continue Learning</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendCourseReminder(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
    progressPct: number,
    daysInactive: number,
  ) {
    const displayName = name || 'there';
    const courseUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}`;
    const subject =
      daysInactive <= 7
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">We Miss You!</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">It's been ${daysInactive} days since you last worked on <strong>${courseTitle}</strong>.</p>
    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
      <p style="color:#64748b;margin:0 0 8px;font-size:13px;">Your progress</p>
      <div style="background:#e2e8f0;border-radius:8px;height:8px;margin:0 auto;max-width:300px;">
        <div style="background:#229C62;height:8px;border-radius:8px;width:${progressPct}%;"></div>
      </div>
      <p style="color:#334155;margin:12px 0 0;font-size:20px;font-weight:700;">${progressPct}% complete</p>
    </div>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You're just a few lessons away from making real progress. Pick up right where you left off.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Resume Course</a>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Consistency is key — even 15 minutes a day adds up fast.</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendMilestoneAchieved(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
    milestone: string,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">${milestone}</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've hit a milestone in <strong>${courseTitle}</strong> — ${milestone}</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Keep going — you're building real skills that matter.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Keep Learning</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
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
              <circle cx="24" cy="24" r="20" fill="none" stroke="#229C62" stroke-width="4"
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Your Weekly Report</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">Here's what you accomplished this week:</p>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:24px 0;">
      <div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#229C62;font-size:28px;font-weight:700;margin:0;">${stats.lessonsCompleted}</p>
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
      ${
        stats.leaderboardPosition
          ? `
      <div style="background:#faf5ff;border-radius:8px;padding:16px;text-align:center;">
        <p style="color:#a855f7;font-size:28px;font-weight:700;margin:0;">#${stats.leaderboardPosition}</p>
        <p style="color:#64748b;font-size:12px;margin:4px 0 0;">Leaderboard</p>
      </div>`
          : ''
      }
    </div>

    ${
      stats.coursesInProgress.length > 0
        ? `
    <p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Courses in Progress</p>
    <div style="margin-bottom:24px;">
      ${coursesHtml}
    </div>`
        : ''
    }

    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Continue Learning</a>
    </div>

    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">Consistency builds expertise. See you next week!</p>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
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
  <div style="background:linear-gradient(135deg,#229C62,#229C62);padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Welcome aboard, ${displayName}</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">Your training starts now</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've joined XpertClass — a platform built for hands-on training across cybersecurity, IT, DevOps, and more. Here's how to get started:</p>

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
          <span style="color:#229C62;font-weight:700;font-size:14px;">2</span>
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
      <a href="${coursesUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Explore Courses</a>
    </div>
    <div style="text-align:center;margin-bottom:12px;">
      <a href="${labsUrl}" style="color:#229C62;font-size:14px;text-decoration:none;font-weight:500;">Or jump into a lab →</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Ready for your first challenge?</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You signed up a couple of days ago — here are some recommended first steps:</p>

    <div style="background:#f0fdf4;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Recommended:</strong> Start with "Linux Fundamentals" — it builds the foundation for everything else on the platform.</p>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="color:#334155;font-size:14px;font-weight:600;margin:0 0 12px;">Quick wins to try:</p>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="color:#229C62;font-size:14px;">✓</span>
        <span style="color:#64748b;font-size:13px;">Complete your first lesson</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="color:#229C62;font-size:14px;">✓</span>
        <span style="color:#64748b;font-size:13px;">Launch a practice lab</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="color:#229C62;font-size:14px;">✓</span>
        <span style="color:#64748b;font-size:13px;">Capture your first flag</span>
      </div>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${coursesUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Learning</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendWelcomeDay7(
    email: string,
    name: string | null,
    enrolledCount: number,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">One week in — here's what's next</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've been with XpertClass for a week now. ${enrolledCount > 0 ? `You've enrolled in ${enrolledCount} course${enrolledCount > 1 ? 's' : ''} so far.` : "You haven't enrolled in any courses yet."}</p>

    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Pro tip:</strong> Students who complete at least one lesson in their first week are 3× more likely to finish a full course.</p>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${enrolledCount > 0 ? dashboardUrl : coursesUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${enrolledCount > 0 ? 'Continue Learning' : 'Browse Courses'}</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendEnrollmentNudge(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Your course is waiting</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You enrolled in <strong>${courseTitle}</strong> but haven't started yet. Now is a great time to begin.</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Just one lesson takes about 15 minutes. Small steps lead to big skills.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start Now</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendPausedCourseNudge(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
    progressPct: number,
    daysInactive: number,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">You're ${progressPct}% through — don't stop now</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You were making great progress in <strong>${courseTitle}</strong> — ${progressPct}% complete. It's been ${daysInactive} days since your last lesson.</p>
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">Consistency matters more than speed. Even one lesson today keeps your momentum going.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${courseUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Resume Course</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
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
  <div style="background:linear-gradient(135deg,#229C62,#229C62);padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Lab launched!</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">You've entered the arena</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You just launched your first hands-on lab — that's how real skills are built.</p>
    <div style="background:#f0fdf4;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>What's next:</strong> Explore the environment, look for vulnerabilities, and capture flags to earn XP.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${labsUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View My Labs</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendFirstFlagCaptured(
    email: string,
    name: string | null,
    labTitle: string,
    points: number,
  ) {
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">First Flag Captured</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">You captured your first flag</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You just captured your first flag in <strong>${labTitle}</strong> — earning <strong>+${points} XP</strong>.</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">This is how attackers think — find the weakness, prove the exploit, claim the flag. Keep going.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${labsUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Capture More Flags</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendLabCompleted(
    email: string,
    name: string | null,
    labTitle: string,
    totalXp: number,
    totalFlags: number,
  ) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab complete: ${labTitle} — ${totalFlags} flags captured!`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0F203A;padding:40px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <p style="font-size:48px;margin:12px 0 0;">🏆</p>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px;">Lab Complete!</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">${labTitle}</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You completed <strong>${labTitle}</strong> — capturing all <strong>${totalFlags} flags</strong> and earning <strong>${totalXp} XP</strong>.</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;text-align:left;">
      <p style="color:#334155;margin:0;font-size:14px;">That's real skill. Every flag means you understood the material well enough to prove it. You're leveling up.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${labsUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Try Another Lab</a>
    </div>
  </div>
  <div style="background:#f8faffc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
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
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">Level ${newLevel} — ${title}</h1>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've reached <strong>Level ${newLevel} — ${title}</strong>. Your skills are growing.</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;">New labs and challenges unlock at higher levels. Keep training to access harder content.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Dashboard</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendLessonCompleted(
    email: string,
    name: string | null,
    lessonTitle: string,
    courseTitle: string,
    courseId: string,
    progressPct: number,
  ) {
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
  <div style="background:linear-gradient(135deg,#229C62,#229C62);padding:24px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <p style="color:#fff;margin:12px 0 0;font-size:32px;">✓</p>
    <h1 style="color:#fff;margin:8px 0 0;font-size:20px;">Lesson Complete</h1>
  </div>
  <div style="padding:28px;">
    <p style="color:#334155;font-size:15px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:15px;line-height:1.6;">You completed <strong>${lessonTitle}</strong> in <strong>${courseTitle}</strong>.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="color:#334155;font-size:14px;margin:0 0 8px;">Course Progress</p>
      <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
        <div style="background:#229C62;height:100%;width:${progressPct}%;border-radius:4px;"></div>
      </div>
      <p style="color:#64748b;font-size:12px;margin:8px 0 0;">${progressPct}% complete</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${courseUrl}" style="background:#229C62;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Continue Course</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendCourseCompleted(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
    totalXp: number,
  ) {
    const displayName = name || 'there';
    const certificateUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses/${courseId}/certificate`;
    const coursesUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/courses`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `Course complete: ${courseTitle} — Congratulations!`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0F203A;padding:40px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <p style="font-size:48px;margin:12px 0 0;">🎓</p>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px;">Course Complete!</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">${courseTitle}</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You completed <strong>${courseTitle}</strong> — earning <strong>${totalXp} XP</strong> along the way.</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;text-align:left;">
      <p style="color:#334155;margin:0;font-size:14px;">This certificate verifies your completion. You can download it or share it on LinkedIn.</p>
    </div>
    <div style="text-align:center;margin:28px 0;display:flex;gap:12px;justify-content:center;">
      <a href="${certificateUrl}" style="background:#f59e0b;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Certificate</a>
      <a href="${coursesUrl}" style="background:#fff;color:#f59e0b;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;border:2px solid #f59e0b;">More Courses</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendStreakReminder(
    email: string,
    name: string | null,
    streakDays: number,
  ) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    return this.send({
      to: email,
      from: 'labs',
      subject: `Don't break your ${streakDays}-day streak!`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">🔥 ${streakDays}-Day Streak</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">Don't let it slip away</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You've been on a <strong>${streakDays}-day streak</strong> — that takes discipline. But if you don't capture a flag or complete a lesson today, your streak resets.</p>
    <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:16px;margin:20px 0;border-radius:4px;text-align:left;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Quick tip:</strong> Even 10 minutes on a lab keeps the streak alive. Just launch a terminal and submit one flag.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${labsUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Keep Your Streak</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendReEngagement(
    email: string,
    name: string | null,
    daysInactive: number,
  ) {
    const displayName = name || 'there';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard`;
    return this.send({
      to: email,
      from: 'auth',
      subject: `We miss you — your labs are waiting`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0F203A;padding:32px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <h1 style="color:#fff;margin:12px 0 0;font-size:24px;">We miss you, ${displayName}</h1>
    <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">It's been ${daysInactive} days since your last visit</p>
  </div>
  <div style="padding:32px;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Your progress, labs, and achievements are all saved. Jump back in wherever you left off.</p>
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;margin:20px 0;border-radius:4px;">
      <p style="color:#334155;margin:0;font-size:14px;"><strong>Tip:</strong> Even 15 minutes of practice keeps your skills sharp. Consistency beats intensity.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Return to Dashboard</a>
    </div>
  </div>
  <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  async sendMissionCompleted(
    email: string,
    name: string | null,
    missionTitle: string,
    xpReward: number,
    missionType: string,
  ) {
    const displayName = name || 'there';
    const dashboardUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard`;
    const emoji =
      missionType === 'monthly' ? '👑' : missionType === 'weekly' ? '📅' : '🎯';
    const typeLabel =
      missionType === 'weekly'
        ? 'Weekly Challenge'
        : missionType === 'monthly'
          ? 'Monthly Boss'
          : 'Daily Mission';
    return this.send({
      to: email,
      from: 'labs',
      subject: `Mission complete: ${missionTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0F203A;padding:40px;text-align:center;">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 305 260" width="56" height="48" role="img" aria-label="XpertClass">
      <g fill="#FFFFFF" fill-rule="evenodd"><path d="M 19.00 35.00 L 19.00 36.00 L 23.00 40.00 L 23.00 41.00 L 31.00 49.00 L 31.00 50.00 L 37.00 56.00 L 37.00 57.00 L 45.00 65.00 L 45.00 66.00 L 52.00 73.00 L 52.00 74.00 L 59.00 81.00 L 59.00 82.00 L 68.00 91.00 L 68.00 92.00 L 76.00 100.00 L 76.00 101.00 L 83.00 108.00 L 83.00 109.00 L 91.00 117.00 L 91.00 118.00 L 99.00 126.00 L 100.00 126.00 L 104.00 130.00 L 105.00 130.00 L 107.00 132.00 L 108.00 132.00 L 109.00 133.00 L 112.00 134.00 L 114.00 136.00 L 115.00 136.00 L 116.00 137.00 L 116.00 139.00 L 114.00 141.00 L 113.00 141.00 L 108.00 145.00 L 105.00 146.00 L 103.00 148.00 L 102.00 148.00 L 101.00 149.00 L 100.00 149.00 L 99.00 150.00 L 96.00 151.00 L 90.00 157.00 L 90.00 158.00 L 81.00 167.00 L 81.00 168.00 L 70.00 179.00 L 70.00 180.00 L 60.00 190.00 L 120.00 190.00 L 121.00 191.00 L 121.00 192.00 L 115.00 198.00 L 115.00 199.00 L 111.00 203.00 L 110.00 203.00 L 110.00 204.00 L 91.00 223.00 L 91.00 224.00 L 82.00 233.00 L 92.00 233.00 L 105.00 220.00 L 105.00 219.00 L 106.00 218.00 L 107.00 218.00 L 108.00 217.00 L 108.00 216.00 L 109.00 215.00 L 110.00 215.00 L 120.00 205.00 L 120.00 204.00 L 144.00 180.00 L 144.00 179.00 L 159.00 164.00 L 159.00 163.00 L 161.00 161.00 L 162.00 161.00 L 162.00 160.00 L 175.00 147.00 L 175.00 146.00 L 183.00 138.00 L 183.00 137.00 L 181.00 135.00 L 181.00 134.00 L 180.00 134.00 L 179.00 133.00 L 179.00 132.00 L 171.00 124.00 L 171.00 123.00 L 164.00 116.00 L 164.00 115.00 L 156.00 107.00 L 156.00 106.00 L 146.00 96.00 L 146.00 95.00 L 137.00 86.00 L 137.00 85.00 L 129.00 77.00 L 129.00 76.00 L 120.00 67.00 L 120.00 66.00 L 112.00 58.00 L 112.00 57.00 L 101.00 46.00 L 101.00 45.00 L 94.00 38.00 L 94.00 37.00 L 93.00 36.00 L 91.00 36.00 L 90.00 35.00 Z"/></g>
      <g fill="#7AD62A" fill-rule="evenodd"><path d="M 94.00 202.00 L 93.00 201.00 L 50.00 201.00 L 42.00 209.00 L 42.00 210.00 L 29.00 223.00 L 29.00 224.00 L 19.00 234.00 L 19.00 235.00 L 63.00 235.00 L 79.00 219.00 L 79.00 218.00 L 84.00 213.00 L 85.00 213.00 L 85.00 212.00 L 93.00 204.00 L 93.00 203.00 Z"/></g>
    </svg>
    <p style="font-size:48px;margin:12px 0 0;">${emoji}</p>
    <h1 style="color:#fff;margin:8px 0 0;font-size:24px;">Mission Complete!</h1>
    <p style="color:#d1fae5;margin:8px 0 0;font-size:14px;">${missionTitle}</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="color:#334155;font-size:16px;line-height:1.6;">Hi ${displayName},</p>
    <p style="color:#334155;font-size:16px;line-height:1.6;">You completed <strong>${typeLabel}</strong> — <strong>${missionTitle}</strong> and earned <strong>${xpReward} XP</strong>.</p>
    <div style="background:#E9F8EE;border-left:4px solid #229C62;padding:16px;margin:20px 0;border-radius:4px;text-align:left;">
      <p style="color:#334155;margin:0;font-size:14px;">Consistency is what separates good from great. Keep stacking those missions.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="background:#229C62;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">View Dashboard</a>
    </div>
  </div>
  <div style="background:#f8faffc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">XpertClass — Training Platform</p>
  </div>
</div>
</body>
</html>`,
    });
  }

  hasPreference(
    emailPrefs: Record<string, boolean> | null,
    category: string,
  ): boolean {
    if (!emailPrefs) return true;
    return emailPrefs[category] !== false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
