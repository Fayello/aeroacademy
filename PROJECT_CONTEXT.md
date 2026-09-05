# AEROACADEMY — Complete Project Context

> **Purpose:** This document provides a comprehensive overview of the AEROACADEMY platform for any AI agent continuing development. Read this file first before touching any code.

---

## 1. What Is This Project?

AEROACADEMY is a **full-stack cybersecurity and technology training platform** — think HackTheBox Academy meets Udemy for security, DevOps, Linux, and cloud. It features:

- **Courses** with video lessons, markdown content, and quizzes
- **Docker-based labs** with browser terminals (CTF-style flag submission)
- **Master classes** (live scheduled sessions with registration)
- **1-on-1 training** with trainers (booking system with time slots)
- **Gamification** — XP, levels, ELO-based divisions (Bronze → Titan), achievements, leaderboard
- **Enterprise portal** — talent pool, classroom management, team progress
- **Admin panel** — full CRUD for courses, labs, master classes, trainers, users; analytics, audit logs, and real-time lab monitoring
- **Notifications** — in-app feed with real-time WebSocket delivery (achievements, flags, bookings, master classes)

**It is NOT just a cybersecurity platform** — the domain covers Linux, DevOps, cloud, and general tech training.

---

## 2. Tech Stack

### Frontend
| Technology | Version | Notes |
|---|---|---|
| Next.js | 16.2.4 | App Router, **`"use client"` on every page** (SPA-like, no server components) |
| React | 19.2.4 | |
| TypeScript | 5.x | Strict mode |
| Tailwind CSS | v4 | CSS-first config via `@import "tailwindcss"` in globals.css — **NO tailwind.config.ts** |
| `@tailwindcss/typography` | — | Used for markdown/prose styling |
| lucide-react | 1.14 | **Exclusively** used for icons — no other icon library |
| react-hook-form | 7.75 | With zod 4.4 validation |
| socket.io-client | 4.8 | Real-time dashboard + lab terminal |
| @xterm/xterm | 6.0 | Browser terminal for labs |
| react-player | 3.4 | Video playback |
| react-markdown | 10.1 | Markdown rendering |
| react-hot-toast | 2.6 | Toast notifications (top-right, white bg) |
| jspdf | 4.2 | Client-side PDF generation for certifications |
| js-cookie | 3.0 | Cookie management |

### Backend
| Technology | Version | Notes |
|---|---|---|
| NestJS | 11 | Modular architecture |
| Prisma | 6.4 | PostgreSQL ORM |
| PostgreSQL | — | Database |
| Passport | — | JWT + Google OAuth |
| dockerode | 5.0 | Docker container management for labs |
| Socket.IO | 4.8 | WebSocket gateways |
| helmet | 8.1 | Security headers |
| @nestjs/throttler | 6.5 | Rate limiting |

### Development
| Tool | Notes |
|---|---|
| Git | GitHub repo: `https://github.com/Fayello/aeroacademy.git` |
| Node.js | Latest LTS |
| Docker | Required for lab infrastructure |

---

## 3. Project Structure

```
AEROACADEMY/
├── frontend/                          # Next.js 16 frontend
│   ├── AGENTS.md                      # CRITICAL: Next.js version warnings
│   ├── package.json
│   ├── next.config.ts                 # standalone output, security headers
│   ├── tsconfig.json                  # ES2017, bundler resolution, @/* alias
│   ├── postcss.config.mjs             # @tailwindcss/postcss
│   ├── eslint.config.mjs              # v9 flat config
│   └── src/
│       ├── app/                       # Next.js App Router pages
│       │   ├── layout.tsx             # Root layout (Inter font, Toaster, Providers)
│       │   ├── globals.css            # Tailwind v4 + component classes
│       │   ├── page.tsx               # Landing page (~687 lines)
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   ├── forgot-password/page.tsx
│       │   ├── reset-password/page.tsx
│       │   ├── get-started/page.tsx    # HTB-style path chooser
│       │   └── dashboard/
│       │       ├── layout.tsx          # Dashboard layout (Sidebar + BottomNav + TokenHandler + NotificationBell)
│       │       ├── page.tsx            # Dashboard home
│       │       ├── courses/            # Course listing, detail, lessons
│       │       ├── labs/               # Lab listing, workspace
│       │       ├── master-classes/     # Master class listing, detail
│       │       ├── training/           # Trainer listing, profile, bookings
│       │       ├── leaderboard/
│       │       ├── certifications/
│       │       ├── notifications/      # Notifications feed
│       │       ├── registry/
│       │       ├── profile/            # Profile, edit, change-password
│       │       ├── enterprise/         # Enterprise portal
│       │       └── admin/              # Overview, analytics, audit, monitoring, users + CRUD pages
│       ├── components/
│       │   ├── Sidebar.tsx             # Desktop sidebar with level gating
│       │   ├── BottomNav.tsx           # Mobile bottom nav
│       │   ├── Modal.tsx               # Accessible modal
│       │   ├── OnboardingCard.tsx      # 3-step wizard
│       │   ├── Skeleton.tsx            # Loading skeletons
│       │   ├── ErrorBoundary.tsx       # 3-tier error boundaries (Root/Page/Component)
│       │   ├── HeroParticles.tsx       # Landing page animated particles
│       │   ├── NotificationBell.tsx    # Fixed top-right dropdown with unread badge
│       │   ├── NotificationTypeIcon.tsx# Icon per notification type
│       │   ├── SkillFusionLab.tsx      # Gamified skill-fusion sandbox
│       │   ├── admin/                  # Reusable admin components
│       │   │   ├── AdminTable.tsx      # Sortable/searchable/paginated, selectable + bulk actions
│       │   │   ├── AdminModal.tsx      # Modal + ConfirmDialog
│       │   │   └── AdminForm.tsx       # Form fields, StatusBadge
│       │   ├── dashboard/              # StatsGrid, IntelligenceCard, LeaderboardPreview, ActivityFeed, SandboxCard
│       │   ├── enterprise/             # ClassroomCommand
│       │   └── ui/                     # Badge, EmptyState, PageHeader
│       ├── hooks/
│       │   ├── useDashboard.ts         # Socket.io singleton hook (dashboard namespace)
│       │   └── useNotifications.ts     # Socket.io singleton hook (notifications namespace)
│       ├── lib/
│       │   ├── api.ts                  # fetchApi wrapper (JWT refresh, auto-logout)
│       │   ├── auth.ts                 # logout()
│       │   ├── constants.ts            # CAMEROON_CITIES, DIVISION_COLORS
│       │   ├── format.ts               # timeAgo, getErrorMessage helpers
│       │   ├── labs.ts                 # Lab/terminal helpers
│       │   └── levelGating.ts          # Level system, locks
│       └── types/
│           └── api.ts                  # All TypeScript interfaces (43 exports)
│
├── backend/                           # NestJS backend
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma              # 29 models, 4 enums
│   │   ├── seed.ts                    # Seed script
│   │   └── seed-data/                 # 5 satellite seed files
│   └── src/
│       ├── main.ts                    # Port 4000, helmet, CORS, ValidationPipe, Swagger /api/docs
│       ├── app.module.ts              # Root module (global AuditInterceptor)
│       ├── auth/                      # JWT, Google OAuth, roles
│       ├── prisma/                    # PrismaService (global)
│       ├── courses/                   # Course/section/lesson/quiz CRUD
│       ├── progress/                  # Lesson completion + gates
│       ├── quiz/                      # Quiz submission + scoring
│       ├── labs/                      # Docker labs + WebSocket terminal
│       ├── dashboard/                 # Stats, WebSocket real-time, achievements, leagues
│       ├── analytics/                 # Admin analytics overview endpoint
│       ├── audit/                     # Audit log query + global AuditInterceptor
│       ├── notifications/             # In-app notifications + WebSocket push
│       ├── users/                     # Admin user management (batch ops)
│       ├── leagues/                   # ELO calculation
│       ├── master-classes/            # Master class CRUD
│       ├── training/                  # Trainer CRUD + bookings
│       ├── admin/                     # Teams, classroom management
│       ├── recruitment/               # Talent pool, shortlisting
│       └── common/                    # Events pub/sub, batch DTOs, audit decorator, crypto, level utils, logger
│
├── PROJECT_CONTEXT.md                 # This file
└── README.md
```

---

## 4. Database Schema (Prisma — PostgreSQL)

### Enums
```prisma
enum Role { STUDENT  ADMIN  RECRUITER }
enum LabStatus { RUNNING  STOPPED  EXPIRED  PROVISIONING }
enum MasterClassStatus { UPCOMING  LIVE  COMPLETED  CANCELLED }
enum BookingStatus { PENDING  CONFIRMED  COMPLETED  CANCELLED }
```

### Core Models (29 total)

| Model | Purpose | Key Relationships |
|---|---|---|
| **User** | Core user account | role, xp, rank (ELO), division, clearanceLevel → Organization, Team |
| **Organization** | Universities/enterprises | type: UNIVERSITY/ENTERPRISE/GOVERNMENT |
| **Team** | Admin-created groups | owner → User, members → User[] |
| **Season** | Competitive season | isActive, multiplier |
| **Course** | Learning paths | → Section[] → Lesson[] |
| **Section** | Course chapters | order, title (used for level gating) |
| **Lesson** | Individual lessons | videoUrl, content (markdown), labId → Lab?, quiz? |
| **Quiz** | Per-lesson quiz | → Question[] → Answer[] |
| **QuizSubmission** | Quiz results | score, passed (80% threshold) |
| **Progress** | Lesson completion | composite PK (userId, lessonId) |
| **Lab** | Docker sandbox | dockerImage, briefing, difficulty (ELO), credentials (encrypted JSON) |
| **LabFlag** | CTF flags | correctAnswer (bcrypt hashed), points |
| **LabSubmission** | Flag attempts | isCorrect |
| **LabInstance** | Running containers | containerId, port, status, expiresAt |
| **Achievement** | Unlockable badges | xpReward |
| **UserAchievement** | Earned badges | composite PK |
| **MasterClass** | Live sessions | instructorName, category, scheduledAt, maxParticipants, status |
| **MasterClassRegistration** | Registrations | composite PK |
| **Trainer** | 1:1 with User | specialties[], hourlyRate |
| **TrainingSlot** | Weekly availability | dayOfWeek (0-6), startTime, endTime |
| **Booking** | Session bookings | topic, notes, status |
| **Shortlist** | Recruiter shortlists | recruiterId, studentId |
| **RefreshToken** | Token rotation | 7-day expiry |
| **PasswordResetToken** | Password reset | 30-min expiry, one-time use |
| **ActivityEvent** | Activity feed rows | userId, type (LAB_STARTED, FLAG_SOLVED, LESSON_COMPLETED...), metadata JSON |
| **AuditLog** | Security audit trail | action, actorId, method, path, statusCode, ip, userAgent (written by AuditInterceptor) |
| **Notification** | In-app notifications | userId, title, message, type (INFO/SUCCESS/WARNING/ACHIEVEMENT/BOOKING/MASTERCLASS), link, read |

---

## 5. Authentication System

### JWT Flow
1. **Login** → `POST /auth/login` → returns `access_token` (15min) + `refresh_token` (7 days)
2. **Storage** → `localStorage.setItem('token', ...)` + `localStorage.setItem('refresh_token', ...)` + cookie `token=...`
3. **Auto-refresh** → `fetchApi()` intercepts 401, calls `POST /auth/refresh` with mutex pattern
4. **Logout** → clears localStorage, cookie, redirects to `/login`

### Google OAuth
1. Frontend redirects to `${API_URL}/auth/google?state=${encodeURIComponent(window.location.origin)}`
2. Backend handles OAuth flow, redirects back with JWT in URL params
3. `TokenHandler` component in dashboard layout extracts token from URL

### Roles & Guards
- `@Roles(Role.ADMIN)` decorator + `RolesGuard` (reads metadata via Reflector)
- Controller-level `@UseGuards(AuthGuard('jwt'))` on all authenticated routes
- Frontend: role stored in `localStorage.getItem('user')` as JSON

### Test Credentials
```
Admin:  user@aeroacademy.org / ChangeMe123!
Student: user@aeroacademy.org / ChangeMe123! (same password for all seeded users)
```

---

## 6. Level & Gating System

### XP & Leveling
```typescript
level = Math.floor(xp / 1000) + 1
```

### Section Gates (Course Content)
| Section Title | Required Level |
|---|---|
| Fundamentals, Beginner, Essentials | 1 |
| Intermediate | 4 |
| Advanced | 7 |
| Expert, Certifications | 10 |

### Lab Difficulty Gates
| Max Difficulty | Required Level |
|---|---|
| ≤ 1100 | 1 |
| ≤ 1300 | 4 |
| ≤ 1500 | 7 |
| > 1500 | 10 |

### Sidebar Gates
| Path | Required Level |
|---|---|
| /dashboard, /dashboard/courses | 1 |
| /dashboard/labs | 3 |
| /dashboard/registry | 5 |
| /dashboard/certifications | 10 |

### ELO Rating System
- K-factor: 32
- Divisions: BRONZE(<800), SILVER(800-1199), GOLD(1200-1599), PLATINUM(1600-1999), DIAMOND(2000-2399), TITAN(2400+)

---

## 7. API Routes Reference

### Auth (`/auth`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register (rate: 5/min) |
| POST | `/auth/login` | No | Login (rate: 10/min) |
| GET | `/auth/google` | No | OAuth redirect |
| GET | `/auth/google/callback` | No | OAuth callback |
| GET | `/auth/me` | JWT | Current user profile |
| PATCH | `/auth/profile` | JWT | Update profile |
| POST | `/auth/change-password` | JWT | Change password (rate: 5/min) |
| GET | `/auth/organizations` | JWT | List organizations |
| POST | `/auth/forgot-password` | No | Send reset token (rate: 3/min) |
| POST | `/auth/reset-password` | No | Reset with token (rate: 5/min) |
| POST | `/auth/refresh` | No | Rotate refresh token |
| POST | `/auth/logout` | No | Delete refresh token |

### Courses (`/courses`) — JWT required
| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/courses` | Any | List all courses |
| GET | `/courses/:id` | Any | Course with sections+lessons |
| GET | `/courses/lessons/:id` | Any | Lesson detail (quiz answers stripped) |
| POST | `/courses` | ADMIN | Create course |
| PATCH | `/courses/:id` | ADMIN | Update course |
| DELETE | `/courses/:id` | ADMIN | Delete course |
| POST | `/courses/batch/delete` | ADMIN | Batch delete courses |
| GET | `/courses/:courseId/sections` | Any | List sections |
| POST | `/courses/:courseId/sections` | ADMIN | Create section |
| PATCH | `/courses/:courseId/sections/:sectionId` | ADMIN | Update section |
| DELETE | `/courses/:courseId/sections/:sectionId` | ADMIN | Delete section |
| GET | `/courses/:courseId/sections/:sectionId/lessons` | Any | List lessons in section |
| POST | `/courses/:courseId/sections/:sectionId/lessons` | ADMIN | Create lesson |
| PATCH | `.../sections/:sectionId/lessons/:lessonId` | ADMIN | Update lesson |
| DELETE | `.../sections/:sectionId/lessons/:lessonId` | ADMIN | Delete lesson |
| GET | `.../lessons/:lessonId/quiz` | Any | Get quiz (no answers) |
| POST | `.../lessons/:lessonId/quiz` | ADMIN | Create quiz |
| PATCH | `.../quiz/:quizId` | ADMIN | Update quiz |
| DELETE | `.../quiz/:quizId` | ADMIN | Delete quiz |

### Progress (`/progress`) — JWT required
| Method | Route | Description |
|---|---|---|
| POST | `/progress/complete` | Mark lesson complete (sequential unlock + quiz + lab gates) |
| GET | `/progress/latest` | Get latest progress |
| GET | `/progress/course/:id` | Get course progress percentage |

### Quiz (`/quiz`) — JWT required
| Method | Route | Description |
|---|---|---|
| GET | `/quiz/lesson/:lessonId` | Get quiz (answers without isCorrect) |
| POST | `/quiz/submit/:quizId` | Submit answers (80% pass threshold) |

### Labs (`/labs`)
| Method | Route | Auth | Rate | Description |
|---|---|---|---|---|
| GET | `/labs/health` | No | — | Health check |
| GET | `/labs/stats` | JWT | — | System stats |
| GET | `/labs` | JWT | — | List all labs |
| GET | `/labs/definition/:id` | JWT | — | Full lab definition (decrypted) |
| GET | `/labs/status/:id` | JWT | — | Instance status |
| POST | `/labs` | ADMIN | — | Create lab |
| PATCH | `/labs/:id` | ADMIN | — | Update lab |
| DELETE | `/labs/:id` | ADMIN | — | Delete lab |
| POST | `/labs/batch/delete` | ADMIN | — | Batch delete labs |
| POST | `/labs/batch/stop` | ADMIN | — | Batch stop lab sessions |
| POST | `/labs/start/:id` | JWT | 3/min | Start Docker container |
| POST | `/labs/stop/:id` | JWT | 5/min | Stop container |
| POST | `/labs/reset/:id` | JWT | 5/min | Reset container |
| POST | `/labs/submit-flag/:flagId` | JWT | 5/min | Submit flag answer |
| POST | `/labs/:labId/flags` | ADMIN | — | Create lab flag |
| PATCH | `/labs/flags/:flagId` | ADMIN | — | Update flag |
| DELETE | `/labs/flags/:flagId` | ADMIN | — | Delete flag |

### Master Classes (`/master-classes`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/master-classes` | No | Browse with filters |
| GET | `/master-classes/:id` | No | Detail |
| POST | `/master-classes/:id/register` | JWT | Register |
| DELETE | `/master-classes/:id/register` | JWT | Unregister |
| GET | `/master-classes/my/registrations` | JWT | My registrations |
| POST | `/master-classes` | ADMIN | Create |
| PATCH | `/master-classes/:id` | ADMIN | Update |
| DELETE | `/master-classes/:id` | ADMIN | Delete |
| POST | `/master-classes/batch/delete` | ADMIN | Batch delete |
| POST | `/master-classes/batch/status` | ADMIN | Batch update status |

### Training (`/training`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/training/trainers` | No | List active trainers |
| GET | `/training/trainers/:id` | No | Trainer detail |
| GET | `/training/trainers/:id/slots` | No | Available slots for date |
| POST | `/training/book` | JWT | Book session |
| DELETE | `/training/bookings/:id` | JWT | Cancel booking |
| GET | `/training/bookings` | JWT | My bookings |
| POST | `/training/trainers` | ADMIN | Add trainer |
| PATCH | `/training/trainers/:id` | ADMIN | Update trainer |
| DELETE | `/training/trainers/:id` | ADMIN | Delete trainer |
| POST | `/training/batch/delete-trainers` | ADMIN | Batch delete trainers |
| POST | `/training/trainers/:id/slots` | ADMIN | Add time slots |
| DELETE | `/training/slots/:id` | ADMIN | Remove slot |

### Dashboard (`/dashboard`)
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/public-stats` | No | Total students, courses, labs |
| GET | `/dashboard/leagues` | JWT | Regional + university leagues |
| GET | `/dashboard/activity` | JWT | My recent activity (last 20) |
| GET | `/dashboard/active-labs` | JWT | My running lab instances |
| GET | `/dashboard/user-stats` | JWT | My stats (XP, completions, rank) |
| GET | `/dashboard/global-activity` | No | Global activity feed (last 30) |
| GET | `/dashboard/active-users` | No | Active lab sessions (admin monitoring) |

### Admin (`/admin`) — JWT + ADMIN/RECRUITER
| Method | Route | Description |
|---|---|---|
| POST | `/admin/teams` | Create team |
| GET | `/admin/teams` | Get my teams |
| POST | `/admin/teams/:teamId/members/:userId` | Add member |
| GET | `/admin/teams/:teamId/progress` | Team progress |
| POST | `/admin/classroom/launch` | Bulk provision labs |
| POST | `/admin/classroom/terminate` | Bulk terminate labs |

### Admin Analytics (`/admin/analytics`) — JWT + ADMIN
| Method | Route | Description |
|---|---|---|
| GET | `/admin/analytics/overview` | Full analytics: totals, growth, distributions, course/lab stats, top performers |

### Admin Audit (`/admin/audit-logs`) — JWT + ADMIN
| Method | Route | Description |
|---|---|---|
| GET | `/admin/audit-logs` | Filter by action, actorId, status, date range, paginated |
| GET | `/admin/audit-logs/summary` | Aggregated counts by action, status, last 24h |

### Admin Users (`/admin/users`) — JWT + ADMIN
| Method | Route | Description |
|---|---|---|
| GET | `/admin/users` | List users (filter by role) |
| GET | `/admin/users/stats` | Total + byRole counts |
| GET | `/admin/users/:id` | Single user detail |
| PATCH | `/admin/users/:id` | Update user (role, xp, profile) |
| DELETE | `/admin/users/:id` | Delete user |
| POST | `/admin/users/batch/delete` | Batch delete users |
| POST | `/admin/users/batch/role` | Batch set role |

### Notifications (`/notifications`) — JWT
| Method | Route | Description |
|---|---|---|
| GET | `/notifications` | List (limit/offset/unreadOnly) |
| GET | `/notifications/unread-count` | Unread count |
| PATCH | `/notifications/read-all` | Mark all read |
| PATCH | `/notifications/:id/read` | Mark one read |
| DELETE | `/notifications/:id` | Delete one |

### Recruitment (`/recruitment`) — JWT + ADMIN/RECRUITER
| Method | Route | Description |
|---|---|---|
| GET | `/recruitment/talent-pool` | Filter by city/org/minXp |
| GET | `/recruitment/candidate/:id` | Candidate profile |
| POST | `/recruitment/shortlist/toggle` | Toggle shortlist |
| GET | `/recruitment/shortlisted` | My shortlisted |
| GET | `/recruitment/leagues` | Regional + university leagues |

---

## 8. Frontend Patterns & Conventions

### Routing
- Next.js App Router with `"use client"` on **every page** (no server components)
- Dynamic routes: `[id]`, `[trainerId]`
- Route groups: `dashboard/` layout wraps all dashboard pages

### UI Design System
- **Primary color:** `emerald-600` (green)
- **Theme:** White background (NOT dark)
- **Cards:** `bg-white rounded-xl border border-slate-200 shadow-sm`
- **Hero headers:** Gradient backgrounds with `/grid.svg` overlay pattern
- **Buttons:** `btn-primary`, `btn-secondary`, `btn-danger`, `btn-ghost` (defined in globals.css)
- **Inputs:** `input-field` class (rounded-lg, emerald focus ring)
- **Icons:** **Exclusively `lucide-react`** — never use other icon libraries
- **Transitions:** `animate-in fade-in duration-500` on page containers
- **Toast:** `react-hot-toast` — top-right, white background, emerald success / red error

### CSS Classes (globals.css)
```css
.btn-primary    /* emerald-600 bg, white text, rounded-lg */
.btn-secondary  /* white bg, slate border, rounded-lg */
.btn-danger     /* red-600 bg, white text, rounded-lg */
.btn-ghost      /* transparent, hover:bg-slate-100 */
.input-field    /* full width, rounded-lg, emerald focus ring */
.card           /* white bg, rounded-xl, slate border, shadow-sm */
```

### Component Patterns
- **Admin CRUD:** Use `AdminTable` + `AdminModal` + `AdminForm` components
- **Page structure:** Gradient header → content → empty states
- **Loading:** Skeleton loaders or `Loader2` spinner from lucide-react
- **Error handling:** `try/catch` with toast.error(), empty states for no data

### API Calls
```typescript
import { fetchApi } from "@/lib/api";

// GET
const data = await fetchApi("/courses");

// POST
const result = await fetchApi("/courses", {
  method: "POST",
  body: JSON.stringify({ title: "New Course" }),
});

// PATCH
await fetchApi(`/courses/${id}`, {
  method: "PATCH",
  body: JSON.stringify({ title: "Updated" }),
});

// DELETE
await fetchApi(`/courses/${id}`, { method: "DELETE" });
```

### Real-time (Socket.io)
```typescript
import { useDashboard } from "@/hooks/useDashboard";

// In component:
const { intelligence, metrics, leaderboard, feed } = useDashboard();
// Global singleton — one socket connection shared across all dashboard pages

import { useNotifications } from "@/hooks/useNotifications";

// Notifications feed + bell:
const { notifications, unread, markRead, markAllRead, remove } = useNotifications();
// Separate singleton on the /notifications namespace
```

### Notifications
- `NotificationBell` component (fixed top-right) shows a dropdown with unread badge; links to `/dashboard/notifications`
- `NotificationTypeIcon` renders a lucide icon per type (ACHIEVEMENT, BOOKING, MASTERCLASS, INFO, SUCCESS, WARNING)
- Notifications are created server-side by `NotificationsService` reacting to `EventsService` pub/sub events (achievement unlocked, flag captured, booking confirmed/cancelled, master class registered/unregistered)

### State Management
- No external state library (Redux, Zustand, etc.)
- `useState` + `useEffect` for local state
- `localStorage` for auth tokens, user data, onboarding state
- Socket.io for real-time data (dashboard + notifications namespaces, both via module-level singleton sockets)

---

## 9. Backend Patterns & Conventions

### Module Structure
Each feature follows NestJS pattern:
```
feature/
├── feature.module.ts      # @Module decorator
├── feature.controller.ts  # Route handlers + guards
├── feature.service.ts     # Business logic
└── dto/                   # Data transfer objects (class-validator)
```

### Guards & Decorators
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN)
async create(@Body() body: CreateDto) { ... }
```

### Prisma Patterns
```typescript
// Find many with relations
return this.prisma.course.findMany({
  include: {
    sections: {
      include: { lessons: true },
      orderBy: { order: 'asc' },
    },
  },
});

// Create
return this.prisma.course.create({
  data: { title, description },
  include: { sections: true },
});

// Update
return this.prisma.course.update({
  where: { id },
  data: { title },
});

// Delete
await this.prisma.course.delete({ where: { id } });
```

### Lab Infrastructure
- Docker containers via `dockerode`
- Port allocation: 8000-9000 range
- Container naming: `lab-{labId}-{userId}-{timestamp}`
- Network: `tactical-net` (Docker bridge)
- Resource limits: 512MB memory, configurable CPU
- Lab expiry: 2 hours default, cron cleanup every 5 min
- Credentials encrypted with AES-256-CBC

### WebSocket Gateways
1. `/terminal` — Docker container terminal (JWT auth, idle timeout 30min)
2. `/dashboard` — Real-time metrics broadcast (10-15s intervals), achievement unlock + global feed push, connected-user tracking
3. `/notifications` — Per-user notification push (`notification:new`, joins `notifications:{userId}` room)

### Events Pub/Sub (EventsService)
- A shared RxJS `Subject<{ type, payload }>` bridges services → gateways/notifications
- Emitters: achievement unlocks (`ACHIEVEMENT_UNLOCKED`), flag captures (`FLAG_CAPTURED`), booking lifecycle, master class registration
- Subscribers: `DashboardGateway` (global feed), `NotificationsGateway` + `NotificationsService` (persist + push in-app notifications)

### Audit Logging
- `@Audit('ACTION_NAME')` decorator (method or class level) marks an endpoint
- Global `AuditInterceptor` writes an `AuditLog` row (action, actor, method, path, status, ip, userAgent, duration) after success or failure
- Queryable via `GET /admin/audit-logs` + `/summary` (ADMIN only)

### Batch Operations
- Shared DTOs in `src/common/batch.dto.ts`: `BatchIdsDto`, `BatchStatusDto`, `BatchRoleDto`, `BatchLabStopDto`
- Exposed as `POST /batch/delete`, `/batch/status`, `/batch/role`, `/batch/stop` across courses, labs, master classes, training, users

---

## 10. Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
```

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/aeroacademy?schema=public
JWT_SECRET=<64-char-hex>
PORT=4000
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LAB_ENCRYPTION_KEY=<32-byte-key>
LAB_EXPIRY_HOURS=2
LAB_MEMORY_MB=512
LAB_CPU_QUOTA=100000
LAB_PORT_START=8000
LAB_PORT_END=9000
LAB_MAX_CONCURRENT=20
```

---

## 11. Key File Locations

### Frontend — Must-Know Files
| File | Purpose |
|---|---|
| `src/app/globals.css` | Tailwind v4 config + component classes |
| `src/lib/api.ts` | `fetchApi()` wrapper — ALL API calls go through this |
| `src/lib/auth.ts` | `logout()` function |
| `src/lib/levelGating.ts` | Level calculation + content locking |
| `src/types/api.ts` | All TypeScript interfaces |
| `src/hooks/useDashboard.ts` | Socket.io singleton |
| `src/components/Sidebar.tsx` | Desktop navigation with level gating |
| `src/components/BottomNav.tsx` | Mobile navigation |
| `src/components/admin/AdminTable.tsx` | Reusable admin table (search/sort/paginate/select/bulk) |
| `src/components/admin/AdminModal.tsx` | Reusable admin modal |
| `src/components/admin/AdminForm.tsx` | Reusable admin form fields |
| `src/components/NotificationBell.tsx` | Real-time notification dropdown |
| `src/hooks/useNotifications.ts` | Notifications socket singleton + CRUD |
| `src/hooks/useDashboard.ts` | Dashboard socket singleton |
| `src/app/dashboard/layout.tsx` | Dashboard layout (auth check, sidebar, TokenHandler, NotificationBell) |
| `src/app/layout.tsx` | Root layout (Inter font, Toaster) |

### Backend — Must-Know Files
| File | Purpose |
|---|---|
| `src/main.ts` | Bootstrap (port 4000, helmet, CORS, ValidationPipe, Swagger /api/docs) |
| `src/app.module.ts` | Root module (imports all feature modules) |
| `prisma/schema.prisma` | **Complete database schema (29 models)** |
| `prisma/seed.ts` | Seed script |
| `src/auth/auth.service.ts` | JWT, login, register, OAuth |
| `src/auth/jwt.strategy.ts` | JWT extraction strategy |
| `src/auth/roles.guard.ts` | Role-based authorization |
| `src/labs/labs.service.ts` | Docker container lifecycle |
| `src/labs/labs.gateway.ts` | WebSocket terminal |
| `src/dashboard/dashboard.gateway.ts` | WebSocket real-time + global feed |
| `src/notifications/notifications.service.ts` | Persist notifications from events |
| `src/notifications/notifications.gateway.ts` | WebSocket push per user |
| `src/audit/audit.interceptor.ts` | Global audit logging |
| `src/analytics/analytics.service.ts` | Admin analytics aggregation |
| `src/common/events.service.ts` | RxJS pub/sub bus |
| `src/common/batch.dto.ts` | Shared batch-operation DTOs |
| `src/common/request-with-user.ts` | Shared authenticated-request type |
| `src/common/level.util.ts` | Server-side level calculation |

---

## 12. Route Map (All Pages)

```
/                                    → Landing page (marketing)
/login                               → Login (email + Google OAuth)
/register                            → Register (email + Google OAuth)
/forgot-password                     → Forgot password
/reset-password?token=...            → Reset password
/get-started                         → Choose individual vs enterprise

/dashboard                           → Dashboard home (stats, cards, feed)
/dashboard/courses                   → Course catalog
/dashboard/courses/:id               → Course detail (modules/lessons)
/dashboard/courses/lessons/:id       → Lesson (video + markdown + quiz + lab link)
/dashboard/labs                      → Lab catalog
/dashboard/labs/:id                  → Lab workspace (terminal + briefing + flags)
/dashboard/master-classes            → Master class catalog
/dashboard/master-classes/:id        → Master class detail + registration
/dashboard/training                  → Trainer listing
/dashboard/training/:trainerId       → Trainer profile + booking
/dashboard/training/bookings         → My bookings
/dashboard/leaderboard               → Global/Regional/University leaderboards
/dashboard/certifications            → XP-based certifications (PDF download)
/dashboard/registry                  → Security registry (verification link)
/dashboard/notifications             → Notifications feed (all/unread, mark read, delete)
/dashboard/profile                   → Profile (level, division, achievements)
/dashboard/profile/edit              → Edit profile
/dashboard/profile/change-password   → Change password
/dashboard/enterprise                → Enterprise portal (talent pool + classroom)
/dashboard/enterprise/registry/:id   → Candidate detail

/dashboard/admin                     → Admin dashboard (stats overview + quick links)
/dashboard/admin/analytics           → Analytics (growth, engagement, completion, top performers)
/dashboard/admin/audit               → Audit logs (filterable security trail)
/dashboard/admin/monitoring          → Lab monitoring (active sessions, force-stop, batch stop)
/dashboard/admin/users               → Manage users (CRUD + batch role/delete)
/dashboard/admin/courses             → Manage courses, sections, lessons, quizzes (CRUD)
/dashboard/admin/labs                → Manage labs + flags (CRUD)
/dashboard/admin/master-classes      → Manage master classes (CRUD + batch status)
/dashboard/admin/trainers            → Manage trainers + slots (CRUD + batch delete)
```

---

## 13. Development Workflow

### Starting the App
```bash
# Backend
cd backend
npm run dev          # Starts on port 4000

# Frontend
cd frontend
npm run dev          # Starts on port 3000
```

### Common Commands
```bash
# Frontend type check
cd frontend && npx tsc --noEmit

# Frontend lint (flat config, React Compiler rules)
cd frontend && npx eslint src

# Backend type check
cd backend && npx tsc --noEmit

# Backend lint (typed-checked, auto-fix)
cd backend && npx eslint "{src,test}/**/*.ts" --fix

# Backend tests
cd backend && npm run test

# Database migrations
cd backend && npx prisma migrate dev

# Seed database
cd backend && npx prisma db seed

# Generate Prisma client
cd backend && npx prisma generate
```

### Git Workflow
- Main branch: `main`
- Commit style: `feat:`, `fix:`, `chore:`, etc.
- Push to: `https://github.com/Fayello/aeroacademy.git`

---

## 14. Important Warnings

### From AGENTS.md
> **This is NOT the Next.js you know.** This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

### Key Gotchas
1. **No `tailwind.config.ts`** — Tailwind v4 uses CSS-first config in `globals.css`
2. **No server components** — Every page has `"use client"` at the top
3. **No `next.config.js`** — Uses `next.config.ts` (TypeScript)
4. **No middleware.ts** — Auth is client-side via localStorage
5. **Icons** — Always use `lucide-react`, never other icon libraries
6. **Colors** — `emerald-600` is the primary accent, white theme
7. **API calls** — Always use `fetchApi()` from `@/lib/api`, never raw `fetch`
8. **Backend port** — 4000 (not 3001)
9. **Frontend port** — 3000
10. **Database** — PostgreSQL with Prisma, not MongoDB or SQLite

---

## 15. Current State (What's Built)

> **For navigation structure, module wiring, and API routes, see `ARCHITECTURE.md`** — this is the single source of truth for integration details.

### Completed
- Full landing page with hero, features, stats, CTA sections (animated HeroParticles)
- Login/Register with Google OAuth
- Dashboard with real-time metrics (Socket.io) + live activity feed
- Course system with sections, lessons, quizzes, progress tracking + admin section/lesson/quiz management
- Lab system with Docker containers, browser terminal, CTF flags + admin flag management
- Master class system with registration
- Training system with trainer profiles, booking, time slots
- Leaderboard with ELO-based divisions (regional + university leagues)
- Certifications with PDF download
- Profile management (edit, change password)
- Admin dashboard with stats + quick links
- Admin CRUD for courses, labs, master classes, trainers, **users**
- **Admin analytics dashboard** (growth, engagement, course/lab completion, top performers)
- **Admin audit logs** (filterable security/action trail)
- **Admin lab monitoring** (active sessions, force-stop, batch stop)
- **Batch operations** (delete/role/status/stop) across courses, labs, master classes, trainers, users
- Reusable admin components (AdminTable with selection/bulk actions, AdminModal, AdminForm)
- Enterprise portal with talent pool, classroom management
- Level gating system (XP-based content locking)
- Achievement system
- **Notifications system** (in-app feed + WebSocket bell, achievement/flag/booking/master-class triggers)
- **SkillFusionLab** gamified sandbox (persisted discoveries, streak, fusion)
- Advanced search/filtering on catalog pages (courses, labs, master classes)
- Error boundaries (3-tier)
- Mobile responsive (sidebar + bottom nav)
- Onboarding wizard
- **Swagger API docs** at `/api/docs`
- **Zero TypeScript `any` debt and zero ESLint problems** across frontend and backend
- **Guild system** — CRUD, membership (MASTER/OFFICER/MEMBER), real-time WebSocket chat, XP contribution, applications for private guilds, invite codes, guild leaderboard
- **Community features** — Social feed, head-to-head comparison, lab challenges, community directory, team-seekers with skill matching
- **Gamification visibility** — AchievementToast, LevelUpModal, XpGain animation, dashboard hero strip, XP badges on course/lab cards
- **Navigation overhaul** — 5-item flat sections per role (INDIVIDUAL, UNIVERSITY, CORPORATE, RECRUITER, ADMIN), EN/FR i18n
- **Email system** — Branded templates (welcome, OTP, password reset, lab started/completed), SMTP via hostinger
- **Localization / i18n** — Full EN/FR translations for navigation and key UI elements
- **Inline practice exercises** — 542 exercises across 205 lessons

### Not Yet Built
- Lab detail page terminal polish
- Advanced analytics exports / PDF reports

### See Also
- `ARCHITECTURE.md` — Navigation source-of-truth, module wiring, API routes, feature status

---

*Last updated: September 2026*
*Git repo: https://github.com/Fayello/aeroacademy.git*
