import * as fs from 'fs';
import * as path from 'path';
import { EmailService } from '../src/email/email.service';
import { EmailTemplateService } from '../src/email/email-template.service';

type CapturedEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

const service = new EmailService({} as never, new EmailTemplateService());
const outDir = path.join(process.cwd(), 'email-previews');
const recipient = 'preview@example.com';
const name = 'Fayell';
let currentName = 'email';
const capturedEmails: CapturedEmail[] = [];

service.send = async (options: CapturedEmail) => {
  capturedEmails.push(options);
  return true;
};

const inquiry = {
  inquiryType: 'enterprise' as const,
  name,
  email: recipient,
  organization: 'XpertClass Labs',
  role: 'Security Lead',
  teamSize: '25-50',
  phone: '+237600000000',
  message:
    'We want practical cyber readiness training with labs, reporting, and recruiter-visible proof records.',
  sourcePage: '/enterprise',
};

const communityApplication = {
  programType: 'ambassador' as const,
  name,
  email: recipient,
  city: 'Douala',
  organization: 'XpertClass Academy',
  role: 'Student leader',
  experience: 'Community events and peer mentoring',
  interests: ['Events', 'Content', 'Campus chapters'],
  contribution:
    'I can host workshops, support learners, collect feedback, and represent the program in my local community.',
  availability: '4 hours per week',
  linkedinUrl: 'https://linkedin.com/in/example',
  portfolioUrl: 'https://example.com',
  sourcePage: '/community/ambassador-program',
};

const previews: Array<{
  name: string;
  run: () => Promise<boolean>;
}> = [
  {
    name: 'institution-inquiry',
    run: () => service.sendInstitutionInquiry(inquiry),
  },
  {
    name: 'inquiry-acknowledgement',
    run: () =>
      service.sendInquiryAcknowledgement(recipient, name, 'enterprise'),
  },
  {
    name: 'community-program-application',
    run: () => service.sendCommunityProgramApplication(communityApplication),
  },
  {
    name: 'community-program-acknowledgement',
    run: () =>
      service.sendCommunityProgramAcknowledgement(
        recipient,
        name,
        'ambassador',
      ),
  },
  { name: 'welcome', run: () => service.sendWelcome(recipient, name) },
  {
    name: 'otp-verification',
    run: () => service.sendOtpVerification(recipient, name, '123456'),
  },
  {
    name: 'verification-email',
    run: () => service.sendVerificationEmail(recipient, name, 'verify-token'),
  },
  {
    name: 'password-reset-otp',
    run: () => service.sendPasswordResetOtp(recipient, name, '654321'),
  },
  {
    name: 'password-reset',
    run: () => service.sendPasswordReset(recipient, 'reset-token'),
  },
  {
    name: 'lab-started',
    run: () =>
      service.sendLabStarted(
        recipient,
        name,
        'Linux Privilege Escalation',
        new Date('2026-09-04T15:00:00Z'),
      ),
  },
  {
    name: 'lab-expiring',
    run: () =>
      service.sendLabExpiring(
        recipient,
        name,
        'Linux Privilege Escalation',
        10,
      ),
  },
  {
    name: 'lab-expired',
    run: () =>
      service.sendLabExpired(recipient, name, 'Linux Privilege Escalation'),
  },
  {
    name: 'account-locked',
    run: () => service.sendAccountLocked(recipient, 5),
  },
  {
    name: 'course-enrolled',
    run: () =>
      service.sendCourseEnrolled(recipient, name, 'Network Defense Basics'),
  },
  {
    name: 'certification-earned',
    run: () =>
      service.sendCertificationEarned(
        recipient,
        name,
        'SOC Analyst Foundations',
      ),
  },
  {
    name: 'course-started',
    run: () =>
      service.sendCourseStarted(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
      ),
  },
  {
    name: 'course-reminder',
    run: () =>
      service.sendCourseReminder(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
        42,
        8,
      ),
  },
  {
    name: 'milestone-achieved',
    run: () =>
      service.sendMilestoneAchieved(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
        'Module 2 completed',
      ),
  },
  {
    name: 'weekly-digest',
    run: () =>
      service.sendWeeklyDigest(recipient, name, {
        lessonsCompleted: 4,
        xpEarned: 320,
        streakDays: 6,
        coursesInProgress: [
          { title: 'Network Defense Basics', progressPct: 42 },
          { title: 'Linux Fundamentals', progressPct: 80 },
        ],
        leaderboardPosition: 12,
      }),
  },
  {
    name: 'welcome-day-1',
    run: () => service.sendWelcomeDay1(recipient, name),
  },
  {
    name: 'welcome-day-3',
    run: () => service.sendWelcomeDay3(recipient, name),
  },
  {
    name: 'welcome-day-7',
    run: () => service.sendWelcomeDay7(recipient, name, 2),
  },
  {
    name: 'enrollment-nudge',
    run: () =>
      service.sendEnrollmentNudge(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
      ),
  },
  {
    name: 'paused-course-nudge',
    run: () =>
      service.sendPausedCourseNudge(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
        42,
        10,
      ),
  },
  {
    name: 'first-lab-launched',
    run: () => service.sendFirstLabLaunched(recipient, name),
  },
  {
    name: 'first-flag-captured',
    run: () =>
      service.sendFirstFlagCaptured(
        recipient,
        name,
        'Linux Privilege Escalation',
        50,
      ),
  },
  {
    name: 'lab-completed',
    run: () =>
      service.sendLabCompleted(
        recipient,
        name,
        'Linux Privilege Escalation',
        250,
        5,
      ),
  },
  { name: 'level-up', run: () => service.sendLevelUp(recipient, name, 4) },
  {
    name: 'lesson-completed',
    run: () =>
      service.sendLessonCompleted(
        recipient,
        name,
        'Packet Capture Review',
        'Network Defense Basics',
        'course-1',
        55,
      ),
  },
  {
    name: 'course-completed',
    run: () =>
      service.sendCourseCompleted(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
        1200,
      ),
  },
  {
    name: 'streak-reminder',
    run: () => service.sendStreakReminder(recipient, name, 7),
  },
  {
    name: 're-engagement',
    run: () => service.sendReEngagement(recipient, name, 14),
  },
  {
    name: 'mission-completed',
    run: () =>
      service.sendMissionCompleted(
        recipient,
        name,
        'Complete two beginner labs',
        150,
        'weekly',
      ),
  },
];

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const preview of previews) {
    currentName = preview.name;
    capturedEmails.length = 0;
    await preview.run();

    const captured = capturedEmails[0];
    if (!captured) {
      throw new Error('No email captured for ' + currentName);
    }

    const baseName = safeName(currentName);
    fs.writeFileSync(path.join(outDir, baseName + '.html'), captured.html);
    fs.writeFileSync(path.join(outDir, baseName + '.txt'), captured.text || '');
  }

  console.log('Generated ' + previews.length + ' email previews in ' + outDir);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
