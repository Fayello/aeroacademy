import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

type EmailCall = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

const recipient = 'learner@example.com';
const name = 'Fayell';

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

const samples: Array<{
  name: string;
  run: (service: EmailService) => Promise<boolean>;
}> = [
  {
    name: 'sendInstitutionInquiry',
    run: (service) => service.sendInstitutionInquiry(inquiry),
  },
  {
    name: 'sendInquiryAcknowledgement',
    run: (service) =>
      service.sendInquiryAcknowledgement(recipient, name, 'enterprise'),
  },
  {
    name: 'sendCommunityProgramApplication',
    run: (service) =>
      service.sendCommunityProgramApplication(communityApplication),
  },
  {
    name: 'sendCommunityProgramAcknowledgement',
    run: (service) =>
      service.sendCommunityProgramAcknowledgement(
        recipient,
        name,
        'ambassador',
      ),
  },
  {
    name: 'sendWelcome',
    run: (service) => service.sendWelcome(recipient, name),
  },
  {
    name: 'sendOtpVerification',
    run: (service) => service.sendOtpVerification(recipient, name, '123456'),
  },
  {
    name: 'sendVerificationEmail',
    run: (service) =>
      service.sendVerificationEmail(recipient, name, 'verify-token'),
  },
  {
    name: 'sendPasswordResetOtp',
    run: (service) => service.sendPasswordResetOtp(recipient, name, '654321'),
  },
  {
    name: 'sendPasswordReset',
    run: (service) => service.sendPasswordReset(recipient, 'reset-token'),
  },
  {
    name: 'sendLabStarted',
    run: (service) =>
      service.sendLabStarted(
        recipient,
        name,
        'Linux Privilege Escalation',
        new Date('2026-09-04T15:00:00Z'),
      ),
  },
  {
    name: 'sendLabExpiring',
    run: (service) =>
      service.sendLabExpiring(
        recipient,
        name,
        'Linux Privilege Escalation',
        10,
      ),
  },
  {
    name: 'sendLabExpired',
    run: (service) =>
      service.sendLabExpired(recipient, name, 'Linux Privilege Escalation'),
  },
  {
    name: 'sendAccountLocked',
    run: (service) => service.sendAccountLocked(recipient, 5),
  },
  {
    name: 'sendCourseEnrolled',
    run: (service) =>
      service.sendCourseEnrolled(recipient, name, 'Network Defense Basics'),
  },
  {
    name: 'sendCertificationEarned',
    run: (service) =>
      service.sendCertificationEarned(
        recipient,
        name,
        'SOC Analyst Foundations',
      ),
  },
  {
    name: 'sendCourseStarted',
    run: (service) =>
      service.sendCourseStarted(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
      ),
  },
  {
    name: 'sendCourseReminder',
    run: (service) =>
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
    name: 'sendMilestoneAchieved',
    run: (service) =>
      service.sendMilestoneAchieved(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
        'Module 2 completed',
      ),
  },
  {
    name: 'sendWeeklyDigest',
    run: (service) =>
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
    name: 'sendWelcomeDay1',
    run: (service) => service.sendWelcomeDay1(recipient, name),
  },
  {
    name: 'sendWelcomeDay3',
    run: (service) => service.sendWelcomeDay3(recipient, name),
  },
  {
    name: 'sendWelcomeDay7',
    run: (service) => service.sendWelcomeDay7(recipient, name, 2),
  },
  {
    name: 'sendEnrollmentNudge',
    run: (service) =>
      service.sendEnrollmentNudge(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
      ),
  },
  {
    name: 'sendPausedCourseNudge',
    run: (service) =>
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
    name: 'sendFirstLabLaunched',
    run: (service) => service.sendFirstLabLaunched(recipient, name),
  },
  {
    name: 'sendFirstFlagCaptured',
    run: (service) =>
      service.sendFirstFlagCaptured(
        recipient,
        name,
        'Linux Privilege Escalation',
        50,
      ),
  },
  {
    name: 'sendLabCompleted',
    run: (service) =>
      service.sendLabCompleted(
        recipient,
        name,
        'Linux Privilege Escalation',
        250,
        5,
      ),
  },
  {
    name: 'sendLevelUp',
    run: (service) => service.sendLevelUp(recipient, name, 4),
  },
  {
    name: 'sendLessonCompleted',
    run: (service) =>
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
    name: 'sendCourseCompleted',
    run: (service) =>
      service.sendCourseCompleted(
        recipient,
        name,
        'Network Defense Basics',
        'course-1',
        1200,
      ),
  },
  {
    name: 'sendStreakReminder',
    run: (service) => service.sendStreakReminder(recipient, name, 7),
  },
  {
    name: 'sendReEngagement',
    run: (service) => service.sendReEngagement(recipient, name, 14),
  },
  {
    name: 'sendMissionCompleted',
    run: (service) =>
      service.sendMissionCompleted(
        recipient,
        name,
        'Complete two beginner labs',
        150,
        'weekly',
      ),
  },
];

describe('EmailService templates', () => {
  it.each(samples)(
    '$name renders branded html and plain text',
    async (sample) => {
      const service = new EmailService({} as never, new EmailTemplateService());
      const send = jest
        .spyOn(service, 'send')
        .mockImplementation(async () => true);

      await expect(sample.run(service)).resolves.toBe(true);

      expect(send).toHaveBeenCalledTimes(1);
      const payload = send.mock.calls[0][0] as EmailCall;

      expect(payload.html).toContain('<!DOCTYPE html>');
      expect(payload.html).toContain('XpertClass');
      expect(payload.html).not.toContain('<svg');
      expect(payload.text).toBeDefined();
      expect(payload.text?.trim().length).toBeGreaterThan(40);
      expect(payload.subject).toBeTruthy();
      expect(payload.to).toBeTruthy();
    },
  );
});
