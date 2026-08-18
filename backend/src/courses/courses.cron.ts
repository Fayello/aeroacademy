import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CoursesService } from './courses.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class CoursesCron {
  private readonly logger = new Logger(CoursesCron.name);
  private reminderRunning = false;

  constructor(
    private readonly coursesService: CoursesService,
    private readonly emailService: EmailService,
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
}
