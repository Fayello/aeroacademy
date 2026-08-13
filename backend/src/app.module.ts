import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { ProgressModule } from './progress/progress.module';
import { LabsModule } from './labs/labs.module';
import { QuizModule } from './quiz/quiz.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventsModule } from './common/events.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LeaguesModule } from './leagues/leagues.module';
import { AdminModule } from './admin/admin.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { MasterClassesModule } from './master-classes/master-classes.module';
import { TrainingModule } from './training/training.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ScheduleModule.forRoot(),
    EventsModule,
    PrismaModule,
    AuthModule,
    CoursesModule,
    ProgressModule,
    LabsModule,
    QuizModule,
    DashboardModule,
    RecruitmentModule,
    LeaguesModule,
    AdminModule,
    MasterClassesModule,
    TrainingModule,
    UsersModule,
    AuditModule,
    AnalyticsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
