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

  private appUrl(path: string) {
    const baseUrl = process.env.FRONTEND_URL || 'https://xpertclass.academy';
    return `${baseUrl}${path}`;
  }

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
    const renderedEmail = this.templates.render({
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
      ...renderedEmail,
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
    const renderedEmail = this.templates.render({
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
          body: 'A team member will follow up with the most relevant next step for your institution or organization.',
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
      ...renderedEmail,
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
    const renderedEmail = this.templates.render({
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
      action: {
        label: 'Reply to applicant',
        href: `mailto:${application.email}`,
      },
      footerNote:
        'Review this applicant from the admin community programs dashboard before making a decision.',
    });

    return this.send({
      to: 'contact@xpertclass.academy',
      from: 'info',
      subject: `${programLabel} application from ${application.name}`,
      ...renderedEmail,
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
    const renderedEmail = this.templates.render({
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
          body: 'We look for reliable contributors who can support learners clearly, represent the platform well, and help communities move from interest to practice.',
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
      ...renderedEmail,
    });
  }

  // ─── AUTH EMAILS ───────────────────────────────────────

  async sendWelcome(email: string, name: string | null) {
    const displayName = name || 'there';
    const loginUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/login`;
    const renderedEmail = this.templates.render({
      eyebrow: 'Welcome to XpertClass',
      title: `Welcome, ${displayName}`,
      subtitle:
        'Your account is ready. Your practical training record starts now.',
      body: [
        'Start with a structured path, launch hands-on labs, and build evidence you can show to instructors, recruiters, and employers.',
        'Your dashboard keeps your progress, XP, certificates, and readiness signals in one place.',
      ],
      panels: [
        {
          title: 'Recommended first step',
          body: 'Complete onboarding so the platform can guide you toward the right courses and labs.',
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
      ...renderedEmail,
    });
  }

  async sendOtpVerification(email: string, name: string | null, code: string) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
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
          body: 'For your security, this verification code can only be used for a short time.',
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
      ...renderedEmail,
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string | null,
    token: string,
  ) {
    const displayName = name || 'there';
    const verifyUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/verify?token=${token}`;
    const renderedEmail = this.templates.render({
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
      ...renderedEmail,
    });
  }

  async sendPasswordResetOtp(email: string, name: string | null, code: string) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Password reset',
      title: 'Reset your XpertClass password',
      subtitle: 'Use this code to continue your password reset.',
      intro: `Hi ${displayName},`,
      body: ['Enter the code below to reset your XpertClass password.'],
      code,
      panels: [
        {
          title: 'Expires in 10 minutes',
          body: 'If you did not request a password reset, you can ignore this email and your password will stay unchanged.',
          tone: 'warning',
        },
      ],
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: `Reset your XpertClass password - Code: ${code}`,
      ...renderedEmail,
    });
  }

  async sendPasswordReset(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/reset-password?token=${resetToken}`;
    const renderedEmail = this.templates.render({
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
          body: 'If you did not request this reset, ignore this email and consider changing your password from settings.',
          tone: 'warning',
        },
      ],
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Reset your XpertClass password',
      ...renderedEmail,
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
    const renderedEmail = this.templates.render({
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
          body: 'Stopping the lab when you are done frees capacity for other learners.',
          tone: 'success',
        },
      ],
      action: { label: 'Open lab', href: labsUrl },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab ready: ${labTitle}`,
      ...renderedEmail,
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
    const renderedEmail = this.templates.render({
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
          body: 'Submit pending flags and capture anything you need from the terminal before the environment shuts down.',
          tone: 'warning',
        },
      ],
      action: { label: 'Return to labs', href: labsUrl },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: `Lab expiring soon: ${labTitle} (${minutesLeft} min)`,
      ...renderedEmail,
    });
  }

  async sendLabExpired(email: string, name: string | null, labTitle: string) {
    const displayName = name || 'there';
    const labsUrl = `${process.env.FRONTEND_URL || 'https://xpertclass.academy'}/dashboard/labs`;
    const renderedEmail = this.templates.render({
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
      ...renderedEmail,
    });
  }

  // ─── SYSTEM EMAILS ─────────────────────────────────────

  async sendAccountLocked(email: string, attempts: number) {
    const renderedEmail = this.templates.render({
      eyebrow: 'Account protection',
      title: 'Account temporarily locked',
      subtitle: 'We locked sign-in for 15 minutes to protect this account.',
      intro:
        'We detected repeated failed sign-in attempts on your XpertClass account.',
      fields: [
        { label: 'Failed attempts', value: attempts },
        { label: 'Lock duration', value: '15 minutes' },
      ],
      panels: [
        {
          title: 'If this was not you',
          body: 'Reset your password immediately and contact support if you see activity you do not recognize.',
          tone: 'danger',
        },
      ],
      action: {
        label: 'Reset Password',
        href: this.appUrl('/forgot-password'),
        variant: 'danger',
      },
      footerNote:
        'This security message was sent because suspicious login activity was detected.',
    });

    return this.send({
      to: email,
      from: 'noreply',
      subject: 'XpertClass - Account Temporarily Locked',
      ...renderedEmail,
    });
  }
  async sendCourseEnrolled(
    email: string,
    name: string | null,
    courseTitle: string,
  ) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Course enrollment',
      title: 'You are enrolled',
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', your course has been added to your learning dashboard.',
      body: [
        'Start when you are ready and use the lessons, labs, and assessments to build a verifiable skills record.',
      ],
      action: {
        label: 'Start Learning',
        href: this.appUrl('/dashboard/courses'),
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'You are enrolled: ' + courseTitle,
      ...renderedEmail,
    });
  }
  async sendCertificationEarned(
    email: string,
    name: string | null,
    certTitle: string,
  ) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Certification earned',
      title: 'Certificate earned',
      subtitle: certTitle,
      intro:
        'Hi ' +
        displayName +
        ', congratulations. You have earned the ' +
        certTitle +
        ' certificate.',
      panels: [
        {
          title: 'Your proof record is growing',
          body: 'Your certificate is available from your dashboard and can support your learner profile.',
          tone: 'success',
        },
      ],
      action: {
        label: 'View Certificate',
        href: this.appUrl('/dashboard/certifications'),
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'Certificate Earned: ' + certTitle,
      ...renderedEmail,
    });
  }
  async sendCourseStarted(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
  ) {
    const displayName = name || 'there';
    const courseUrl = this.appUrl('/dashboard/courses/' + courseId);
    const renderedEmail = this.templates.render({
      eyebrow: 'Course started',
      title: 'Your learning path is active',
      subtitle: courseTitle,
      intro: 'Hi ' + displayName + ', you have started ' + courseTitle + '.',
      panels: [
        {
          title: 'Recommended pace',
          body: 'Work through the first module, complete the checks, and use the labs to prove what you learned.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Continue Learning',
        href: courseUrl,
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'Your journey begins: ' + courseTitle,
      ...renderedEmail,
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
    const courseUrl = this.appUrl('/dashboard/courses/' + courseId);
    const subject =
      daysInactive <= 7
        ? 'Your course is waiting - ' + courseTitle
        : 'Do not lose your progress - ' + courseTitle + ' is waiting';
    const renderedEmail = this.templates.render({
      eyebrow: 'Learning reminder',
      title: 'Pick up where you left off',
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', it has been ' +
        daysInactive +
        ' days since you last worked on this course.',
      fields: [
        { label: 'Progress', value: progressPct + '% complete' },
        { label: 'Inactive for', value: daysInactive + ' days' },
      ],
      panels: [
        {
          title: 'Small sessions count',
          body: 'A focused session today keeps your training record moving forward.',
          tone: 'default',
        },
      ],
      action: {
        label: 'Resume Course',
        href: courseUrl,
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject,
      ...renderedEmail,
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
    const courseUrl = this.appUrl('/dashboard/courses/' + courseId);
    const renderedEmail = this.templates.render({
      eyebrow: 'Milestone reached',
      title: milestone,
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', you reached a milestone in ' +
        courseTitle +
        '.',
      panels: [
        {
          title: 'Keep building evidence',
          body: 'Every completed milestone strengthens your learning record and readiness profile.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Keep Learning',
        href: courseUrl,
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject: 'Milestone reached: ' + milestone + ' - ' + courseTitle,
      ...renderedEmail,
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
    const dashboardUrl = this.appUrl('/dashboard');
    const courseSummary =
      stats.coursesInProgress.length > 0
        ? stats.coursesInProgress
            .slice(0, 4)
            .map((course) => course.title + ' - ' + course.progressPct + '%')
            .join('; ')
        : 'No active courses this week';
    const renderedEmail = this.templates.render({
      eyebrow: 'Weekly learning report',
      title: 'Your weekly learning report',
      subtitle: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      intro:
        'Hi ' +
        displayName +
        ', here is what your training record shows this week.',
      fields: [
        { label: 'Lessons completed', value: stats.lessonsCompleted },
        { label: 'XP earned', value: stats.xpEarned },
        { label: 'Current streak', value: stats.streakDays + ' days' },
        {
          label: 'Leaderboard',
          value: stats.leaderboardPosition
            ? '#' + stats.leaderboardPosition
            : 'Not ranked this week',
        },
        { label: 'Courses in progress', value: courseSummary },
      ],
      panels: [
        {
          title: 'Next step',
          body: 'Open your dashboard to continue the course or lab with the strongest impact on your readiness score.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Continue Learning',
        href: dashboardUrl,
      },
    });

    return this.send({
      to: email,
      from: 'info',
      subject:
        'Your Weekly Learning Report - ' +
        stats.lessonsCompleted +
        ' lessons completed',
      ...renderedEmail,
    });
  }
  async sendWelcomeDay1(email: string, name: string | null) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Getting started',
      title: 'Welcome aboard, ' + displayName,
      subtitle: 'Your practical training record starts now.',
      intro:
        'XpertClass is built around hands-on learning, labs, and proof of capability.',
      panels: [
        {
          title: 'Start with structure',
          body: 'Browse courses and choose a path that matches your current skill level.',
          tone: 'default',
        },
        {
          title: 'Practice in labs',
          body: 'Use isolated lab environments to turn lessons into evidence of practical skill.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Explore Courses',
        href: this.appUrl('/dashboard/courses'),
      },
      secondaryAction: {
        label: 'Open Labs',
        href: this.appUrl('/dashboard/labs'),
        variant: 'secondary',
      },
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Welcome to XpertClass - Your journey starts here',
      ...renderedEmail,
    });
  }
  async sendWelcomeDay3(email: string, name: string | null) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'First challenge',
      title: 'Ready for your first hands-on challenge?',
      subtitle: 'A small win creates momentum.',
      intro:
        'Hi ' +
        displayName +
        ', here are recommended first steps for your XpertClass account.',
      panels: [
        {
          title: 'Recommended start',
          body: 'Begin with a foundation course, complete one lesson, then launch a beginner-friendly lab.',
          tone: 'success',
        },
        {
          title: 'What counts',
          body: 'Lessons, checks, flags, and completed labs all help build your readiness profile.',
          tone: 'default',
        },
      ],
      action: {
        label: 'Start Learning',
        href: this.appUrl('/dashboard/courses'),
      },
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Getting started - Your first hands-on challenge',
      ...renderedEmail,
    });
  }
  async sendWelcomeDay7(
    email: string,
    name: string | null,
    enrolledCount: number,
  ) {
    const displayName = name || 'there';
    const hasEnrollment = enrolledCount > 0;
    const renderedEmail = this.templates.render({
      eyebrow: 'First week check-in',
      title: 'One week in - here is what comes next',
      subtitle: hasEnrollment
        ? 'You have started building your training record.'
        : 'Your first course is still waiting.',
      intro:
        'Hi ' +
        displayName +
        ', you have been with XpertClass for a week. ' +
        (hasEnrollment
          ? 'You have enrolled in ' +
            enrolledCount +
            ' course' +
            (enrolledCount > 1 ? 's' : '') +
            ' so far.'
          : 'You have not enrolled in a course yet.'),
      panels: [
        {
          title: 'Best next step',
          body: hasEnrollment
            ? 'Continue your active course and complete the next lesson or lab.'
            : 'Choose one beginner-friendly course and complete the first lesson today.',
          tone: 'success',
        },
      ],
      action: {
        label: hasEnrollment ? 'Continue Learning' : 'Browse Courses',
        href: hasEnrollment
          ? this.appUrl('/dashboard')
          : this.appUrl('/dashboard/courses'),
      },
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Your first week - How did it go?',
      ...renderedEmail,
    });
  }
  async sendEnrollmentNudge(
    email: string,
    name: string | null,
    courseTitle: string,
    courseId: string,
  ) {
    const displayName = name || 'there';
    const courseUrl = this.appUrl('/dashboard/courses/' + courseId);
    const renderedEmail = this.templates.render({
      eyebrow: 'Course reminder',
      title: 'Your course is waiting',
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', you enrolled in ' +
        courseTitle +
        ' but have not started yet.',
      panels: [
        {
          title: 'Keep it small',
          body: 'One lesson is enough to start the habit and move your profile forward.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Start Now',
        href: courseUrl,
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'You enrolled in ' + courseTitle + ' - ready to start?',
      ...renderedEmail,
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
    const courseUrl = this.appUrl('/dashboard/courses/' + courseId);
    const renderedEmail = this.templates.render({
      eyebrow: 'Course progress',
      title: 'Resume your progress',
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', you are ' +
        progressPct +
        '% through this course and have been away for ' +
        daysInactive +
        ' days.',
      fields: [
        { label: 'Progress', value: progressPct + '% complete' },
        { label: 'Inactive for', value: daysInactive + ' days' },
      ],
      panels: [
        {
          title: 'Momentum matters',
          body: 'A short session today keeps the path active and protects your learning rhythm.',
          tone: 'default',
        },
      ],
      action: {
        label: 'Resume Course',
        href: courseUrl,
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'Pick up where you left off - ' + courseTitle,
      ...renderedEmail,
    });
  }
  async sendFirstLabLaunched(email: string, name: string | null) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Lab milestone',
      title: 'First lab launched',
      subtitle: 'You have started hands-on practice.',
      intro:
        'Hi ' +
        displayName +
        ', you launched your first lab. This is where lessons become practical skill.',
      panels: [
        {
          title: 'What to do next',
          body: 'Explore the environment, document what you find, and submit flags when you can prove the answer.',
          tone: 'success',
        },
      ],
      action: {
        label: 'View My Labs',
        href: this.appUrl('/dashboard/labs'),
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'First lab launched - hands-on practice started',
      ...renderedEmail,
    });
  }
  async sendFirstFlagCaptured(
    email: string,
    name: string | null,
    labTitle: string,
    points: number,
  ) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Lab proof',
      title: 'First flag captured',
      subtitle: labTitle,
      intro:
        'Hi ' +
        displayName +
        ', you captured your first flag and earned ' +
        points +
        ' XP.',
      panels: [
        {
          title: 'Proof of practice',
          body: 'A captured flag means you found the evidence and proved the result. Keep building that record.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Capture More Flags',
        href: this.appUrl('/dashboard/labs'),
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'First flag captured - +' + points + ' XP',
      ...renderedEmail,
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
    const renderedEmail = this.templates.render({
      eyebrow: 'Lab complete',
      title: 'Lab completed',
      subtitle: labTitle,
      intro:
        'Hi ' +
        displayName +
        ', you completed the lab and captured ' +
        totalFlags +
        ' flags.',
      fields: [
        { label: 'XP earned', value: totalXp },
        { label: 'Flags captured', value: totalFlags },
      ],
      panels: [
        {
          title: 'Capability evidence added',
          body: 'Completed labs strengthen your readiness record because they show practical execution, not just theory.',
          tone: 'success',
        },
      ],
      action: {
        label: 'Try Another Lab',
        href: this.appUrl('/dashboard/labs'),
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject:
        'Lab complete: ' + labTitle + ' - ' + totalFlags + ' flags captured',
      ...renderedEmail,
    });
  }
  async sendLevelUp(email: string, name: string | null, newLevel: number) {
    const displayName = name || 'there';
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
    const title = levelNames[newLevel] || 'Level ' + newLevel;
    const renderedEmail = this.templates.render({
      eyebrow: 'Level up',
      title: 'Level ' + newLevel + ' - ' + title,
      subtitle: 'Your skills record has advanced.',
      intro:
        'Hi ' +
        displayName +
        ', you reached Level ' +
        newLevel +
        ' - ' +
        title +
        '.',
      panels: [
        {
          title: 'Higher readiness',
          body: 'Level progress reflects consistent learning, lab work, and challenge completion across the platform.',
          tone: 'success',
        },
      ],
      action: {
        label: 'View Dashboard',
        href: this.appUrl('/dashboard'),
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'Level up - You are now ' + title,
      ...renderedEmail,
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
    const courseUrl = this.appUrl('/dashboard/courses/' + courseId);
    const renderedEmail = this.templates.render({
      eyebrow: 'Lesson complete',
      title: lessonTitle,
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', you completed a lesson and moved this course to ' +
        progressPct +
        '% complete.',
      fields: [{ label: 'Course progress', value: progressPct + '% complete' }],
      action: {
        label: 'Continue Course',
        href: courseUrl,
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'Lesson complete: ' + lessonTitle,
      ...renderedEmail,
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
    const certificateUrl = this.appUrl(
      '/dashboard/courses/' + courseId + '/certificate',
    );
    const renderedEmail = this.templates.render({
      eyebrow: 'Course complete',
      title: 'Course completed',
      subtitle: courseTitle,
      intro:
        'Hi ' +
        displayName +
        ', you completed ' +
        courseTitle +
        ' and earned ' +
        totalXp +
        ' XP.',
      panels: [
        {
          title: 'Certificate available',
          body: 'Your completion can now support your learner profile and readiness evidence.',
          tone: 'success',
        },
      ],
      action: {
        label: 'View Certificate',
        href: certificateUrl,
        variant: 'warning',
      },
      secondaryAction: {
        label: 'More Courses',
        href: this.appUrl('/dashboard/courses'),
        variant: 'secondary',
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'Course complete: ' + courseTitle + ' - Congratulations',
      ...renderedEmail,
    });
  }
  async sendStreakReminder(
    email: string,
    name: string | null,
    streakDays: number,
  ) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Training streak',
      title: streakDays + '-day streak at risk',
      subtitle: 'Complete one lesson or submit one flag to keep it active.',
      intro:
        'Hi ' +
        displayName +
        ', you have built a ' +
        streakDays +
        '-day streak. Keep it moving today.',
      panels: [
        {
          title: 'Quick action',
          body: 'A short lab session or one completed lesson is enough to maintain your training rhythm.',
          tone: 'warning',
        },
      ],
      action: {
        label: 'Keep Your Streak',
        href: this.appUrl('/dashboard/labs'),
        variant: 'warning',
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'Do not break your ' + streakDays + '-day streak',
      ...renderedEmail,
    });
  }
  async sendReEngagement(
    email: string,
    name: string | null,
    daysInactive: number,
  ) {
    const displayName = name || 'there';
    const renderedEmail = this.templates.render({
      eyebrow: 'Training reminder',
      title: 'Your XpertClass progress is waiting',
      subtitle: 'It has been ' + daysInactive + ' days since your last visit.',
      intro:
        'Hi ' +
        displayName +
        ', your progress, labs, and achievements are saved. You can return exactly where you left off.',
      panels: [
        {
          title: 'A short session is enough',
          body: 'Even 15 minutes of focused practice keeps your skills sharp and your record active.',
          tone: 'default',
        },
      ],
      action: {
        label: 'Return to Dashboard',
        href: this.appUrl('/dashboard'),
      },
    });

    return this.send({
      to: email,
      from: 'auth',
      subject: 'Your labs are waiting',
      ...renderedEmail,
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
    const typeLabel =
      missionType === 'weekly'
        ? 'Weekly Challenge'
        : missionType === 'monthly'
          ? 'Monthly Boss'
          : 'Daily Mission';
    const renderedEmail = this.templates.render({
      eyebrow: 'Mission complete',
      title: typeLabel + ' completed',
      subtitle: missionTitle,
      intro:
        'Hi ' +
        displayName +
        ', you completed ' +
        missionTitle +
        ' and earned ' +
        xpReward +
        ' XP.',
      fields: [
        { label: 'Mission type', value: typeLabel },
        { label: 'XP reward', value: xpReward },
      ],
      panels: [
        {
          title: 'Consistency recorded',
          body: 'Completed missions help show steady practice across your learning journey.',
          tone: 'success',
        },
      ],
      action: {
        label: 'View Dashboard',
        href: this.appUrl('/dashboard'),
      },
    });

    return this.send({
      to: email,
      from: 'labs',
      subject: 'Mission complete: ' + missionTitle,
      ...renderedEmail,
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
