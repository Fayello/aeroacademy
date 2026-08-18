import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoursesService } from './courses.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesCron {
  private readonly logger = new Logger(CoursesCron.name);
  private reminderRunning = false;
  private digestRunning = false;
  private welcomeDripRunning = false;
  private nudgeRunning = false;

  constructor(
    private readonly coursesService: CoursesService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  private isReasonableHour(timezone: string | null): boolean {
    try {
      const tz = timezone || 'UTC';
      const hour = parseInt(
        new Date().toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }),
        10,
      );
      return hour >= 9 && hour < 21;
    } catch {
      return true;
    }
  }

  private async canSendEmail(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastEmailSentAt: true },
    });
    if (!user?.lastEmailSentAt) return true;
    const hoursSince = (Date.now() - new Date(user.lastEmailSentAt).getTime()) / (1000 * 60 * 60);
    return hoursSince >= 4;
  }

  private async markEmailSent(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastEmailSentAt: new Date() },
    }).catch(() => {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleWelcomeDrip() {
    if (this.welcomeDripRunning) return;
    this.welcomeDripRunning = true;

    try {
      this.logger.log('Processing welcome drip emails...');

      const verifiedUsers = await this.prisma.user.findMany({
        where: {
          role: 'STUDENT',
          emailVerified: { not: null },
        },
        select: { id: true, email: true, name: true, createdAt: true, welcomeDripSent: true, timezone: true, lastEmailSentAt: true },
      });

      const now = new Date();
      let sent = 0;

      for (const user of verifiedUsers) {
        if (!user.email) continue;
        if (!this.isReasonableHour(user.timezone)) continue;
        if (!(await this.canSendEmail(user.id))) continue;

        const daysSinceRegistration = Math.floor(
          (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
        );

        const sentDays = (user.welcomeDripSent as number[]) || [];

        try {
          if (daysSinceRegistration >= 1 && !sentDays.includes(1)) {
            await this.emailService.sendWelcomeDay1(user.email, user.name);
            sentDays.push(1);
            sent++;
          } else if (daysSinceRegistration >= 3 && !sentDays.includes(3)) {
            await this.emailService.sendWelcomeDay3(user.email, user.name);
            sentDays.push(3);
            sent++;
          } else if (daysSinceRegistration >= 7 && !sentDays.includes(7)) {
            const enrolledCount = await this.prisma.courseEnrollment.count({
              where: { userId: user.id },
            });
            await this.emailService.sendWelcomeDay7(user.email, user.name, enrolledCount);
            sentDays.push(7);
            sent++;
          } else {
            continue;
          }

          await this.prisma.user.update({
            where: { id: user.id },
            data: { welcomeDripSent: sentDays },
          });
          await this.markEmailSent(user.id);
        } catch (err) {
          this.logger.error(`Failed to send drip to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      this.logger.log(`Welcome drip complete. Sent ${sent} email(s).`);
    } catch (err) {
      this.logger.error(`Welcome drip failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.welcomeDripRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async handleNudgeCampaigns() {
    if (this.nudgeRunning) return;
    this.nudgeRunning = true;

    try {
      this.logger.log('Running nudge campaigns...');

      const now = new Date();
      const enrollments = await this.prisma.courseEnrollment.findMany({
        where: {
          user: { role: 'STUDENT' },
        },
        include: {
          user: { select: { id: true, email: true, name: true, timezone: true, lastEmailSentAt: true } },
          course: { select: { id: true, title: true } },
        },
      });

      let sent = 0;

      for (const enrollment of enrollments) {
        if (!enrollment.user.email) continue;
        if (!this.isReasonableHour(enrollment.user.timezone)) continue;
        if (!(await this.canSendEmail(enrollment.user.id))) continue;

        const daysSinceEnrolled = Math.floor(
          (now.getTime() - new Date(enrollment.enrolledAt).getTime()) / (1000 * 60 * 60 * 24),
        );

        const daysSinceActivity = Math.floor(
          (now.getTime() - new Date(enrollment.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
        );

        // Get progress
        const totalLessons = await this.prisma.lesson.count({
          where: { section: { courseId: enrollment.courseId } },
        });
        const startedLessons = await this.prisma.progress.count({
          where: { userId: enrollment.userId, lesson: { section: { courseId: enrollment.courseId } } },
        });
        const completedLessons = await this.prisma.progress.count({
          where: { userId: enrollment.userId, completed: true, lesson: { section: { courseId: enrollment.courseId } } },
        });

        const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        try {
          // Nudge 1: Enrolled 48+ hours ago, never started
          if (daysSinceEnrolled >= 2 && startedLessons === 0) {
            await this.emailService.sendEnrollmentNudge(
              enrollment.user.email,
              enrollment.user.name,
              enrollment.course.title,
              enrollment.courseId,
            );
            sent++;
            await this.markEmailSent(enrollment.user.id);
          }
          // Nudge 2: Paused 3+ days, has some progress but not finished
          else if (daysSinceActivity >= 3 && startedLessons > 0 && completedLessons < totalLessons) {
            await this.emailService.sendPausedCourseNudge(
              enrollment.user.email,
              enrollment.user.name,
              enrollment.course.title,
              enrollment.courseId,
              progressPct,
              daysSinceActivity,
            );
            sent++;
            await this.markEmailSent(enrollment.user.id);
          }
        } catch (err) {
          this.logger.error(`Nudge failed for ${enrollment.user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      this.logger.log(`Nudge campaigns complete. Sent ${sent} email(s).`);
    } catch (err) {
      this.logger.error(`Nudge campaigns failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.nudgeRunning = false;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handleInactivityReminders() {
    if (this.reminderRunning) return;
    this.reminderRunning = true;

    try {
      this.logger.log('Checking for inactive course enrollments...');

      const inactive = await this.coursesService.getInactiveEnrollments(7);

      if (inactive.length === 0) {
        this.logger.log('No inactive enrollments found.');
        return;
      }

      this.logger.log(`Found ${inactive.length} inactive enrollment(s), sending reminders...`);

      for (const enrollment of inactive) {
        if (!enrollment.user.email) continue;
        if (!this.isReasonableHour(enrollment.user.timezone)) continue;
        if (!(await this.canSendEmail(enrollment.userId))) continue;

        try {
          const progress = await this.coursesService.getEnrollment(
            enrollment.userId,
            enrollment.courseId,
          );

          const daysInactive = Math.floor(
            (Date.now() - new Date(enrollment.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
          );

          await this.emailService.sendCourseReminder(
            enrollment.user.email,
            enrollment.user.name,
            enrollment.course.title,
            enrollment.courseId,
            0,
            daysInactive,
          );

          await this.coursesService.markReminderSent(enrollment.userId, enrollment.courseId);
          await this.markEmailSent(enrollment.userId);
          this.logger.log(`Reminder sent to ${enrollment.user.email} for "${enrollment.course.title}"`);
        } catch (err) {
          this.logger.error(`Failed to send reminder to ${enrollment.user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      this.logger.log('Inactivity reminder cycle complete.');
    } catch (err) {
      this.logger.error(`Inactivity check failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.reminderRunning = false;
    }
  }

  @Cron('0 9 * * 1')
  async handleWeeklyDigest() {
    if (this.digestRunning) return;
    this.digestRunning = true;

    try {
      this.logger.log('Sending weekly digest emails...');

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const activeUsers = await this.prisma.user.findMany({
        where: {
          role: 'STUDENT',
          emailVerified: { not: null },
          lastActivityDate: { gte: oneWeekAgo },
        },
        select: { id: true, email: true, name: true, currentStreak: true, rank: true },
      });

      let sent = 0;
      for (const user of activeUsers) {
        if (!user.email) continue;

        try {
          const [lessonsCompleted, enrollments] = await Promise.all([
            this.prisma.progress.count({
              where: {
                userId: user.id,
                completed: true,
                updatedAt: { gte: oneWeekAgo },
              },
            }),
            this.prisma.courseEnrollment.findMany({
              where: { userId: user.id },
              include: { course: { select: { id: true, title: true } } },
            }),
          ]);

          const xpEarned = lessonsCompleted * 100;

          const coursesInProgress: { title: string; progressPct: number }[] = [];
          for (const enrollment of enrollments) {
            const total = await this.prisma.lesson.count({
              where: { section: { courseId: enrollment.courseId } },
            });
            const completed = await this.prisma.progress.count({
              where: {
                userId: user.id,
                completed: true,
                lesson: { section: { courseId: enrollment.courseId } },
              },
            });
            if (completed > 0 && completed < total) {
              coursesInProgress.push({
                title: enrollment.course.title,
                progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
              });
            }
          }

          if (lessonsCompleted > 0 || coursesInProgress.length > 0) {
            await this.emailService.sendWeeklyDigest(user.email, user.name, {
              lessonsCompleted,
              xpEarned,
              streakDays: user.currentStreak,
              coursesInProgress,
              leaderboardPosition: user.rank || undefined,
            });
            sent++;
          }
        } catch (err) {
          this.logger.error(`Failed to send digest to ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      this.logger.log(`Weekly digest sent to ${sent} user(s).`);
    } catch (err) {
      this.logger.error(`Weekly digest failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.digestRunning = false;
    }
  }
}
