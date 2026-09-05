# ARCHITECTURE.md — Single Source of Truth

> **Purpose:** This file is the authoritative reference for navigation structure, module wiring, API routes, and feature status. Any AI agent working on this project MUST read this file first. When navigation, i18n, or module wiring changes, update THIS file.

---

## 1. Navigation — Source of Truth

### INDIVIDUAL Learner (Default)

| Section | href | tKey | icon | label |
|---------|------|------|------|-------|
| **Dashboard** | `/dashboard` | `nav.dashboard` | `Home` | Dashboard |
| **Learn** | `/dashboard/courses` | `nav.courses` | `GraduationCap` | Courses |
| | `/dashboard/learning-paths` | `nav.paths` | `Route` | Learning Paths |
| | `/dashboard/training` | `nav.masterclasses` | `Award` | Master Classes |
| | `/dashboard/certifications` | `nav.certifications` | `Award` | Certifications |
| **Practice** | `/dashboard/labs` | `nav.labs` | `FlaskConical` | Labs |
| | `/dashboard/exams` | `nav.exams` | `ClipboardCheck` | Exams |
| | `/dashboard/assessments` | `nav.assessments` | `Target` | Assessments |
| **Compete** | `/dashboard/ranking` | `nav.ranking` | `Trophy` | Leaderboard |
| | `/dashboard/head-to-head` | `nav.headToHead` | `Swords` | Head-to-Head |
| | `/dashboard/challenges/lab-challenges` | `nav.labChallenges` | `Swords` | Lab Challenges |
| **Community** | `/dashboard/community` | `nav.community` | `Megaphone` | Community |
| | `/dashboard/guilds` | `nav.guilds` | `Shield` | Guilds |
| | `/dashboard/teams` | `nav.teams` | `Users` | Teams |
| | `/dashboard/leaderboard` | `nav.leaderboard` | `Trophy` | Leaderboard |
| **Profile** | `/dashboard/profile` | `nav.profile` | `User` | Profile |

### UNIVERSITY / INSTRUCTOR

Same as INDIVIDUAL plus:
- Learn section adds: `/dashboard/training/my-sessions` → `nav.trainerDashboard` → `BookOpen` → "Trainer Dashboard"
- Practice section uses icon `ShieldCheck` for Exams
- Replaces Compete/Community with **Academic** section: `/dashboard/academics` (`nav.academics`, `ClipboardCheck`), `/dashboard/curricula` (`nav.curricula`, `BookOpen`), `/dashboard/gradebook` (`nav.gradebook`, `Target`)

### CORPORATE

| Section | href | tKey | icon | label |
|---------|------|------|------|-------|
| Dashboard | `/dashboard` | `nav.dashboard` | `Home` | Dashboard |
| Learn | `/dashboard/courses` | `nav.courses` | `GraduationCap` | Courses |
| | `/dashboard/learning-paths` | `nav.paths` | `Route` | Learning Paths |
| Practice | `/dashboard/labs` | `nav.labs` | `FlaskConical` | Labs |
| | `/dashboard/certifications` | `nav.certifications` | `Award` | Certifications |
| Enterprise | `/dashboard/enterprise` | `nav.enterprise` | `Building2` | Enterprise Portal |
| | `/dashboard/curricula` | `nav.curricula` | `BookOpen` | Curricula |
| | `/dashboard/gradebook` | `nav.gradebook` | `ClipboardCheck` | Gradebook |
| Profile | `/dashboard/profile` | `nav.profile` | `User` | Profile |

### RECRUITER (Admin View)

| Section | href | tKey | icon | label |
|---------|------|------|------|-------|
| Dashboard | `/dashboard/enterprise` | `nav.enterprise` | `Building2` | Talent Portal |
| Pipeline | `/dashboard/admin/inquiries` | `nav.inquiries` | `Inbox` | Inquiries |
| | `/dashboard/admin/community-programs` | `nav.community` | `Megaphone` | Community |
| | `/dashboard/admin/courses` | `nav.courses` | `GraduationCap` | Courses |
| Settings | `/dashboard/settings` | `nav.settings` | `Settings` | Settings |

### ADMIN (Admin View)

| Section | href | tKey | icon | label |
|---------|------|------|------|-------|
| Dashboard | `/dashboard/admin` | `nav.adminDashboard` | `ShieldCheck` | Admin Dashboard |
| Users | `/dashboard/admin/users` | `nav.users` | `Users` | Users |
| | `/dashboard/admin/cohort-intelligence` | `nav.cohorts` | `Megaphone` | Cohorts |
| | `/dashboard/admin/community-programs` | `nav.community` | `Megaphone` | Community |
| Content | `/dashboard/admin/courses` | `nav.courses` | `GraduationCap` | Courses |
| | `/dashboard/admin/labs` | `nav.labs` | `FlaskConical` | Labs |
| | `/dashboard/admin/assessments` | `nav.assessments` | `ClipboardCheck` | Assessments |
| Security | `/dashboard/admin/security` | `nav.security` | `Lock` | Security Ops |
| | `/dashboard/admin/audit` | `nav.audit` | `ScrollText` | Audit Logs |
| | `/dashboard/admin/threats` | `nav.threats` | `ShieldAlert` | Threats |
| Analytics | `/dashboard/admin/analytics` | `nav.analytics` | `TrendingUp` | Analytics |
| | `/dashboard/admin/predictive-analytics` | `nav.predictive` | `ShieldAlert` | Predictive |
| | `/dashboard/admin/monitoring` | `nav.monitoring` | `Activity` | Monitoring |

### Backend Conditional Sections (from `navigation.service.ts`)

- **Academic**: added when `isEnrolledInCohort = true`
- **Teach**: added when `isTeaching = true` — items: `/dashboard/curricula` (`nav.teach.curricula`), `/dashboard/cohorts` (`nav.teach.cohorts`), `/dashboard/exams` (`nav.teach.exams`), `/dashboard/gradebook` (`nav.teach.gradebook`)

### ICON_MAP (Sidebar.tsx)

Every `icon` string in navigation MUST resolve here:

```
Home, GraduationCap, FlaskConical, Swords, User, Shield, ShieldCheck,
Award, Route, Target, BookOpen, Activity, Building2, ClipboardCheck,
Inbox, Lock, Megaphone, ScrollText, ShieldAlert, TrendingUp, Trophy,
Settings, Users
```

All imported from `lucide-react`.

### Bottom Nav (Mobile)

**Learner**: Home, Courses, Labs, Leaderboard (if compete section exists), Notifications, Profile
**ADMIN**: Dashboard, Users, Content, Security, Alerts
**RECRUITER**: Talent, Inquiries, Programs, Alerts

---

## 2. Module Wiring — Backend

### AppModule imports (in order)

```
ConfigModule, EmailModule, ThrottlerModule, ScheduleModule, EventsModule,
PrismaModule, AuthModule, CoursesModule, ProgressModule, LabsModule,
QuizModule, DashboardModule, RecruitmentModule, LeaguesModule, AdminModule,
MasterClassesModule, TrainingModule, UsersModule, AuditModule, AnalyticsModule,
NotificationsModule, ChallengesModule, BadgesModule, AssessmentsModule,
LearningPathsModule, VerifyModule, GuildsModule, TrafficTrackerModule,
ThreatIntelModule, SecurityOpsModule
```

### EventsModule (Global)

Provides: `EventsService`, `ActivityService`, `ProgressionService`, `MasteryService`, `MasteryCron`
Imports: `GuildsModule` (for XP contribution hook)

### ProgressionService → GuildsService

`ProgressionService.awardXP()` calls `guildsService.contributeXp(userId, amount)` after every user XP update. This is the ONLY hook point for guild XP. No other file directly modifies `user.xp`.

### GuildsModule

Provides: `GuildsService`
Imports: `PrismaModule`, `AuthModule`, `JwtModule`
Exports: `GuildsService`
Contains: `GuildsController`, `GuildChatGateway` (WebSocket `/guild-chat` namespace)

---

## 3. API Routes — Guilds

| Method | Route | Handler | Auth | Notes |
|--------|-------|---------|------|-------|
| POST | `/v1/guilds` | createGuild | JWT | Creates guild + MASTER member |
| GET | `/v1/guilds` | browseGuilds | JWT | Public guilds, optional `?search=` |
| GET | `/v1/guilds/mine` | getMyGuild | JWT | Current user's guild |
| GET | `/v1/guilds/leaderboard` | getGuildLeaderboard | JWT | Top guilds by XP |
| GET | `/v1/guilds/seekers` | getGuildSeekers | JWT | Users with `seekingTeam=true` |
| POST | `/v1/guilds/seeking-guild` | toggleSeekingGuild | JWT | Toggles `User.seekingTeam` |
| POST | `/v1/guilds/leave` | leaveGuild | JWT | Master cannot leave |
| POST | `/v1/guilds/join/:code` | joinByCode | JWT | Invite code join |
| GET | `/v1/guilds/:id` | getGuildDetail | JWT | Full guild with members |
| PATCH | `/v1/guilds/:id` | updateGuild | JWT | Master: all, Officer: desc/motto/domain |
| DELETE | `/v1/guilds/:id` | disbandGuild | JWT | Master only |
| POST | `/v1/guilds/:id/join` | joinGuild | JWT | Public guilds only |
| POST | `/v1/guilds/:id/apply` | applyToGuild | JWT | Creates PENDING application |
| POST | `/v1/guilds/:id/applications/:appId` | reviewApplication | JWT | Officer+: APPROVED/REJECTED |
| GET | `/v1/guilds/:id/applications` | getApplications | JWT | Officer+: pending applications |
| DELETE | `/v1/guilds/:id/members/:userId` | kickMember | JWT | Officer+, cannot kick master |
| POST | `/v1/guilds/:id/promote/:userId` | promoteMember | JWT | Master only, max 5 officers |
| POST | `/v1/guilds/:id/demote/:userId` | demoteMember | JWT | Master only |
| POST | `/v1/guilds/:id/refresh-code` | refreshInviteCode | JWT | Master only |
| GET | `/v1/guilds/:id/chat` | getChatHistory | JWT | Messages with user info |
| POST | `/v1/guilds/:id/chat` | sendChatMessage | JWT | Membership check |
| POST | `/v1/guilds/:id/chat/pin/:messageId` | pinMessage | JWT | Officer+ only |
| GET | `/v1/guilds/:id/feed` | getGuildFeed | JWT | Member activity events |

**CRITICAL ROUTING:** `leave` and `join/:code` routes are BEFORE `:id` param routes to avoid NestJS matching them as `:id`.

---

## 4. WebSocket — Guild Chat

**Namespace:** `/guild-chat`
**Auth:** JWT via `client.handshake.auth.token`

Events:
- `join-guild` → joins room `guild:{guildId}`
- `leave-guild` → leaves room
- `send-message` → delegates to `guildsService.sendChatMessage()`, broadcasts `new-message`
- `typing` / `stop-typing` → broadcast to room

Frontend connects via `io(origin + "/guild-chat", { auth: { token } })`.

---

## 5. API Routes — Certifications

Base: `/v1/certifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | JWT | Get user's domain-lab certifications |
| GET | `/evaluate` | JWT | Evaluate eligibility for XCA/XCP/XCE |
| GET | `/awards` | JWT | List user's certification awards |
| POST | `/award/:code` | JWT | Claim a certification (XCA/XCP/XCE) |
| GET | `/record` | JWT | Build professional record |
| GET | `/record/share` | JWT | Generate shareable record token |
| GET | `/record/:token` | Public | View shared professional record |
| GET | `/admin/all` | ADMIN | List all certification definitions |
| PUT | `/admin/:id` | ADMIN | Update certification (name, description, xp, active, requirements) |
| GET | `/admin/stats` | ADMIN | Certification award statistics |

**Auto-award:** Triggered after every XP award in `ProgressionService` when `newXp >= 5000`. Also runs daily at 3AM via `CertificationCron`.

**Notification:** On award, sends in-app `ACHIEVEMENT` notification + emits `CERTIFICATION_AWARDED` event.

**Seed data:** `backend/ops/seed-certifications.sql` — XCA (5000 XP), XCP (15000 XP), XCE (30000 XP).

---

## 6. Gamification — Component Map

| Component | Location | Trigger | Wired to |
|-----------|----------|---------|----------|
| AchievementToast | `gamification/AchievementToast.tsx` | `lastAchievement` from socket | `DashboardSocketContext` |
| LevelUpModal | `gamification/LevelUpModal.tsx` | Level change detection via ref | `DashboardSocketContext.userMetrics` |
| XpGain | `gamification/XpGain.tsx` | `showXpGain(amount)` global call | Lesson complete, flag capture |
| DailyMissions | `dashboard/DailyMissions.tsx` | Mount on dashboard | Self-contained |
| SkillProfile | `dashboard/SkillProfile.tsx` | Mount on dashboard | Self-contained |
| SocialFeed | `dashboard/SocialFeed.tsx` | Mount on dashboard | `GET /dashboard/global-activity` |
| LeaderboardPreview | `dashboard/LeaderboardPreview.tsx` | Mount on dashboard | `leaderboard` from socket |

**XP Award Points** (all go through `ProgressionService.awardXP()`):
- Lesson complete: 100 XP (with streak multiplier up to 1.5x)
- Flag solved: flag.points
- Quiz passed: 150 XP
- Badge earned: badge.xpReward
- Streak bonus: 500 XP every 7 days
- Referral: 500 XP each
- Boss mission: boss.xpReward
- Daily combo: 100-500 XP
- Cross-domain mission: mission.xpReward
- Achievement: ach.xpReward
- Global event: event.xpReward

---

## 7. Community Features

| Feature | Frontend Route | Backend Endpoint | Status |
|---------|---------------|------------------|--------|
| Social Feed | Dashboard widget | `GET /dashboard/global-activity` | Live |
| Head-to-Head | `/dashboard/head-to-head` | `GET /dashboard/leaderboard` | Live |
| Lab Challenges | `/dashboard/challenges/lab-challenges` | `POST /v1/challenges/lab-challenges` | Live |
| Community Directory | `/dashboard/community` | `GET /dashboard/team-seekers` | Live |
| Teams | `/dashboard/teams` | `GET /v1/leagues/teams` | Live |
| Guilds | `/dashboard/guilds` | `GET /v1/guilds` | Live |
| Leaderboard | `/dashboard/leaderboard` | `GET /dashboard/leaderboard` | Live |

---

## 8. Competitive Win Plan — Pillar Status

| Pillar | Name | Status | Key Features |
|--------|------|--------|--------------|
| 1 | Navigation Overhaul | ✅ Complete | 5-item flat sections, role-based, i18n EN/FR |
| 2 | Lab Experience | ✅ Complete | iframe embedding, walkthroughs, checkpoints, resource profiles, analytics |
| 3 | Gamification Visibility | ✅ Complete | AchievementToast, LevelUpModal, XpGain, hero strip, XP badges |
| 4 | Community + Guilds | ✅ Complete | Social feed, H2H, challenges, guilds with chat/XP/applications |
| 5 | Certification Pathway | 🟡 Complete | Seed data, auto-award engine, PDF generation, notifications, admin UI, shared record page |
| 6 | Mobile | 🟡 Complete | Safe areas, lab mobile view, PWA install, SW caching, table fallbacks |

---

## 9. Known Gotchas

1. **Prisma BigInt**: Returns as string. Frontend must use `Number(value)` to convert.
2. **NEXT_PUBLIC_API_URL=""**: Empty string means relative URLs → nginx routes `/api/*` to backend.
3. **Docker cache**: Always `docker builder prune --all --force` before building.
4. **NEVER prune lab images**: Listed in AGENTS.md.
5. **`NODE_ENV=production`**: Blocks `prisma db seed`.
6. **JWT strategy**: Uses `payload.sub` → `req.user.id` in `jwt.strategy.ts validate()`.
7. **Welcome emails**: Handled by `OnboardingService` via `USER_REGISTERED` event (NOT auth module).
8. **SMTP**: `smtp.hostinger.com:465`, auth user `contact@xpertclass.academy`.
9. **`User.seekingTeam`**: Shared between Teams and Guilds "looking for group" features.
10. **`POST /guilds/seeking-guild`**: Orphaned endpoint — frontend uses `POST /dashboard/seeking-team` instead. Both toggle `User.seekingTeam`. The guild endpoint exists for API completeness but has no frontend caller.

---

*Last updated: September 5, 2026*
