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

  constructor(
    private readonly coursesService: CoursesService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

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
