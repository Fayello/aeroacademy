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
import { EmailModule } from './email/email.module';
import { ChallengesModule } from './challenges/challenges.module';
import { BadgesModule } from './badges/badges.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { LearningPathsModule } from './learning-paths/learning-paths.module';
import { VerifyModule } from './verify/verify.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { TeamEnrollmentsModule } from './team-enrollments/team-enrollments.module';
import { CourseAdminModule } from './course-admin/course-admin.module';
import { CertificationsModule } from './certifications/certifications.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SeasonsModule } from './seasons/seasons.module';
import { BattlePassModule } from './battle-pass/battle-pass.module';
import { BossMissionsModule } from './boss-missions/boss-missions.module';
import { GlobalEventsModule } from './global-events/global-events.module';
import { RankingModule } from './ranking/ranking.module';
import { CrossDomainModule } from './cross-domain/cross-domain.module';
import { DomainRankingModule } from './domain-ranking/domain-ranking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 500,
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
    ChallengesModule,
    BadgesModule,
    AssessmentsModule,
    LearningPathsModule,
    VerifyModule,
    DiscussionsModule,
    TeamEnrollmentsModule,
    CourseAdminModule,
    CertificationsModule,
    OnboardingModule,
    SeasonsModule,
    BattlePassModule,
    BossMissionsModule,
    GlobalEventsModule,
    RankingModule,
    CrossDomainModule,
    DomainRankingModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
