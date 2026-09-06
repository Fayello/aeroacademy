# XpertClass E2E UAT Report — 10 User Perspectives
**Date:** 2026-09-06  
**Tester:** Automated Selenium (10 real user viewpoints)  
**Screenshots:** `tests/uat-e2e/screenshots/` (26 captures)

---

## EXECUTIVE SUMMARY

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 8 |
| MEDIUM | 6 |
| **TOTAL** | **18** |

The platform has solid backend infrastructure and good dashboard UX **after login**, but suffers from major **visibility gaps** — content that exists but is invisible to users unless they already know the URLs. The two most damaging issues: public course and lab catalogs are completely empty walls, and the lab detail breadcrumb shows raw UUIDs.

---

## CRITICAL ISSUES (4)

### C1. Public Course Catalog Is a Dead Wall
**Perspective:** First-Time Visitor, Prospective Student  
**Screenshot:** `005-p2-courses-page.png`  
**Problem:** The `/courses` page shows "Course catalog is available after sign-in" with zero courses visible. A prospective student evaluating the platform sees NOTHING. They cannot assess course quality, topics, or count before committing to registration.  
**Impact:** MASSIVE conversion killer. Users evaluating competitors (Coursera, Udemy, TryHackMe) can browse courses freely. We force registration blind.  
**Fix:** Show a **public course catalog** with:
- Course cards (title, description, lesson count, difficulty, XP value)
- Category filtering
- "Sign up to start" CTA on each card
- Hide enrolled-specific data (progress, certificates) behind login

### C2. Public Lab Catalog Is a Dead Wall
**Perspective:** First-Time Visitor, Lab Experimenter  
**Screenshot:** `003-p1-labs-public.png`  
**Problem:** The `/labs` page shows "Lab catalog is available after sign-in" with zero labs visible. The platform's biggest differentiator (540 hands-on labs) is completely invisible to prospects.  
**Impact:** Users cannot evaluate the lab experience before signing up. The homepage mentions "540 hands-on labs" but clicking "Labs" in the nav shows nothing.  
**Fix:** Show a **public lab catalog** with:
- Lab cards (title, domain, difficulty, estimated time)
- Domain filtering (Security, Linux, DevOps, etc.)
- "Sign up to access" CTA
- Maybe show 1-2 sample labs with limited access

### C3. Lab Detail Shows Raw UUID in Breadcrumb
**Perspective:** Lab Experimenter  
**Screenshot:** `015-p6-lab-detail.png`  
**Problem:** The breadcrumb shows `Learner View > Labs > 76cc73c5 c198 4392 affa 37d2fb7be2a9` — a raw UUID instead of the lab name. Users have no idea what lab they're looking at.  
**Impact:** Confusing and unprofessional. Users cannot orient themselves.  
**Fix:** Breadcrumb should show the lab's actual name (e.g., "DVWA Fundamentals") instead of the UUID. The lab name is available from the API response.

### C4. Lab Detail Page Shows Only "Loading lab..." Indefinitely
**Perspective:** Lab Experimenter  
**Screenshot:** `015-p6-lab-detail.png`  
**Problem:** After clicking a lab, the page shows a spinner with "Loading lab..." and nothing else. No lab title, no description, no objectives, no "Start Lab" button. The user sees a blank page with a spinner.  
**Impact:** Users don't know if the page is broken or just slow. No fallback content, no lab info while loading.  
**Fix:** 
- Show lab metadata (title, description, objectives, difficulty) immediately from the page props
- Show a proper loading state with lab name
- Only show spinner for the terminal/workspace area, not the entire page

---

## HIGH ISSUES (8)

### H1. Sidebar Has No "Get Started" or "Onboarding" Link for New Users
**Perspective:** New Learner  
**Screenshot:** `006-p3-dashboard-home.png`  
**Problem:** A new user logging in for the first time sees a sidebar with 20+ links but no clear "Start Here" or "Getting Started" path. The sidebar structure (Learn, Practice, Compete, Community) assumes the user already knows what they want.  
**Impact:** New users experience choice paralysis. They don't know whether to start with Courses, Labs, Learning Paths, or something else.  
**Fix:** Add a prominent "Start Here" or "First Steps" section at the top of the sidebar for users with <100 XP. Guide them through: 1) Pick a course, 2) Complete first lesson, 3) Try a lab.

### H2. Dashboard Courses Page Has No "Recommended Starting Point"
**Perspective:** New Learner, Returning Learner  
**Screenshot:** `007-p3-my-courses.png`  
**Problem:** The courses page shows 20 courses in a flat grid with no recommendation engine visible. Every course says "Begin training" with no guidance on which to start with. The "Personalized Focus" banner mentions "Security + Cybersecurity" but doesn't link to a specific recommended course.  
**Impact:** Users don't know which course to start with. They may pick an advanced course first and get frustrated.  
**Fix:** Add a "Recommended for You" or "Start Here" section at the top with 1-3 courses matched to their onboarding selections. Show "Continue Where You Left Off" for returning users.

### H3. "Learner View Active" Banner Is Persistent and Wastes Space
**Perspective:** All logged-in users  
**Screenshot:** All dashboard screenshots  
**Problem:** Every dashboard page shows a persistent "Learner View active — LEARNER — You are in learner space" banner at the top. This banner takes up ~80px of vertical space on every page and provides no value after the first time. It also shows "Open Admin Workspace" button which confuses regular learners.  
**Impact:** Wasted screen real estate, especially on mobile. Confusing for non-admin users.  
**Fix:** 
- Show the banner once on first login, then dismiss
- Or make it a subtle indicator in the header (like a badge) instead of a full banner
- Only show "Open Admin Workspace" to admin users

### H4. Search Bar Says "Search course catalog..." but Navigates to Courses on Enter
**Perspective:** Active Learner  
**Screenshot:** `006-p3-dashboard-home.png`  
**Problem:** The global search bar at the top says "Search course catalog..." with Ctrl+/ shortcut. But typing and pressing Enter navigates to `/dashboard/courses?q=term` which is just the courses page with a filter. It doesn't search labs, assessments, certifications, or any other content.  
**Impact:** Users expect global search but get course-only filtering. Labs, which are the platform's differentiator, are not searchable from the global search.  
**Fix:** Either:
- Make it a true global search (Cmd+K palette) that searches courses, labs, assessments, etc.
- Or rename it to "Filter courses..." to set correct expectations

### H5. Mobile Navigation Requires Hamburger Menu — Key Pages Hidden
**Perspective:** Mobile User  
**Screenshot:** `009-p5-mobile-homepage.png`, `011-p5-mobile-dashboard.png`  
**Problem:** On mobile, the entire sidebar is hidden behind a hamburger menu. Users must tap the hamburger to access Courses, Labs, Certifications, etc. The hamburger itself is small and easy to miss.  
**Impact:** Mobile users may not realize there's more content available. They might think the dashboard homepage IS the entire platform.  
**Fix:** 
- Add a bottom tab bar on mobile for the top 4-5 actions (Home, Courses, Labs, Community, Profile)
- Or add quick-access icons below the welcome banner on mobile

### H6. Community Page Shows "No Activity Yet" and "No Leaderboard Data" Empty States
**Perspective:** Community Explorer  
**Screenshot:** `022-p9-community.png`  
**Problem:** The community page has "Recent Activity: No activity yet" and "Top Performers: No leaderboard data" empty states with no guidance on what to do next. The user sees dead sections.  
**Impact:** Community features feel abandoned. New users don't know how to generate activity.  
**Fix:** 
- Show sample activity or "Be the first to post" CTA
- Show placeholder leaderboard with "Complete labs to appear here"
- Add a "Create First Post" or "Join a Team" prompt

### H7. Certifications Page Shows "Requirements Pending" Without Clear Next Step
**Perspective:** Job Seeker  
**Screenshot:** `016-p7-certifications.png`  
**Problem:** All three certification tiers (XCA, XCP, XCE) show "Requirements pending" badge. The requirements are listed (e.g., "Need 3 more domain(s) with 70%+ mastery and 10+ labs") but there's no "Start Working Toward This" button or link to the relevant courses/labs.  
**Impact:** Users see what they need but don't know how to get there. The gap between "where I am" and "what I need" is not bridged.  
**Fix:** Add a "Start Path" button that links to a learning path or recommended courses for that certification tier.

### H8. Leaderboard Link Appears Twice in Sidebar
**Perspective:** All users  
**Screenshot:** `006-p3-dashboard-home.png`  
**Problem:** "Leaderboard" appears in both the "Compete" section AND the "Community" section of the sidebar. This is confusing — users don't know which one to click.  
**Impact:** Navigation confusion. Users may think they're different leaderboards.  
**Fix:** Remove the duplicate. Keep Leaderboard in "Compete" (where it logically belongs) and remove it from "Community".

---

## MEDIUM ISSUES (6)

### M1. No Footer on Public Pages
**Perspective:** First-Time Visitor  
**Screenshot:** `001-p1-homepage.png`  
**Problem:** Public pages (homepage, courses, labs) have no footer with links to Terms, Privacy, About, Contact. The homepage has a minimal footer with just "2026 XpertClass — Hands-on cybersecurity training."  
**Impact:** Users cannot find legal pages, contact info, or about page from the homepage.  
**Fix:** Add a proper footer with: Terms, Privacy Policy, About, Contact, GitHub, social links.

### M2. "Choose Your Path" Button on Homepage Doesn't Look Clickable
**Perspective:** First-Time Visitor  
**Screenshot:** `001-p1-homepage.png`  
**Problem:** The "Choose Your Path" element next to the CTA looks like a text label with a play icon, not a clickable button. Users may not realize it's interactive.  
**Impact:** Users may miss the alternative CTA and only see "Start Free for 1 Year."  
**Fix:** Make it look more like a button or add underline/hover state that clearly indicates clickability.

### M3. Mobile Touch Targets Below 44px on Login/Register
**Perspective:** Mobile User  
**Screenshot:** `010-p5-mobile-login.png`  
**Problem:** Several interactive elements on login and register pages are below the 44px minimum touch target size.  
**Impact:** Mobile users may struggle to tap small buttons/links.  
**Fix:** Increase all interactive elements to minimum 44x44px on mobile viewports.

### M4. Admin Dashboard Shows "Learner View active" Banner
**Perspective:** Admin  
**Screenshot:** `024-p10-admin-dashboard.png`  
**Problem:** When an admin navigates to `/dashboard/admin`, the page still shows "Learner View active — LEARNER" banner at the top, even though they're viewing admin content.  
**Impact:** Confusing — the banner contradicts what the user is actually seeing.  
**Fix:** The banner should reflect the actual view mode. If viewing admin content, show "Admin View active" or hide the banner entirely.

### M5. Labs Page Has 540 Labs in a Flat List — No Pagination or Lazy Loading
**Perspective:** Lab Experimenter  
**Screenshot:** `014-p6-labs-list.png`  
**Problem:** The labs page loads all 540 labs at once in a scrollable grid. This creates an extremely long page that takes time to render and is overwhelming.  
**Impact:** Slow page load, overwhelming choice, hard to find specific labs.  
**Fix:** Add pagination or infinite scroll. Show 20-30 labs per page with "Load More" or page numbers.

### M6. No Visual Distinction Between "Core" and Non-Core Courses
**Perspective:** New Learner  
**Screenshot:** `007-p3-my-courses.png`  
**Problem:** All courses show a "CORE" badge but there's no distinction between core required courses and elective/optional courses. Users don't know which are mandatory vs optional.  
**Impact:** Users may waste time on elective courses when they should focus on core ones.  
**Fix:** Clearly differentiate core vs elective courses. Show "Recommended Path" that orders courses by priority.

---

## NAVIGATION ARCHITECTURE ANALYSIS

### What Works Well
1. **Sidebar structure** is logical: Learn → Practice → Compete → Community
2. **Breadcrumbs** work on most pages (except lab detail UUID issue)
3. **Dashboard homepage** has good "Resume Practical Work" and "Certification Pathway" sections
4. **Mobile hamburger menu** works and is accessible
5. **Course cards** show useful metadata (XP, modules, duration, difficulty)

### Navigation Pain Points Summary
1. **Public catalogs are empty** — biggest conversion blocker
2. **No "Start Here" guidance** for new users — choice paralysis
3. **Search is course-only** — doesn't search labs or other content
4. **Leaderboard duplicated** in sidebar
5. **"Learner View" banner wastes space** on every page
6. **Lab detail page is broken** (UUID breadcrumb + loading state)
7. **No mobile bottom nav** — everything hidden behind hamburger
8. **No footer** on public pages

---

## PRIORITY FIX ORDER

| Priority | Issue | Impact | Effort |
|----------|-------|--------|--------|
| 1 | C1: Public course catalog | Conversion | Medium |
| 2 | C2: Public lab catalog | Conversion | Medium |
| 3 | C3: Lab UUID breadcrumb | UX | Low |
| 4 | C4: Lab loading state | UX | Low |
| 5 | H1: No "Start Here" guidance | Onboarding | Medium |
| 6 | H2: No course recommendations | Retention | Medium |
| 7 | H4: Search is course-only | Discoverability | Medium |
| 8 | H8: Duplicate leaderboard | Navigation | Low |
| 9 | H3: Learner View banner | Screen space | Low |
| 10 | H6: Empty community states | Engagement | Low |
| 11 | H7: Certifications next step | Conversion | Low |
| 12 | M1: No footer | Navigation | Low |
| 13 | M5: 540 labs flat list | Performance | Medium |

---

## SCREENSHOT INDEX

| # | File | Perspective | Key Finding |
|---|------|-------------|-------------|
| 001 | p1-homepage | New Visitor | Homepage is strong, good value prop |
| 002 | p1-courses-catalog | New Visitor | (Same as 005) |
| 003 | p1-labs-public | New Visitor | **EMPTY WALL** — no labs shown |
| 004 | p1-get-started | New Visitor | Get-started page works |
| 005 | p2-courses-page | Prospective Student | **EMPTY WALL** — no courses shown |
| 006 | p3-dashboard-home | New Learner | Dashboard is rich, but no "Start Here" |
| 007 | p3-my-courses | New Learner | 20 courses, no recommendation |
| 008 | p4-returning-dashboard | Returning Learner | Same as dashboard home |
| 009 | p5-mobile-homepage | Mobile User | Hamburger works, CTA visible |
| 010 | p5-mobile-login | Mobile User | Login works on mobile |
| 011 | p5-mobile-dashboard | Mobile User | Dashboard readable, long scroll |
| 012 | p5-mobile-courses | Mobile User | Courses grid works on mobile |
| 013 | p5-mobile-labs | Mobile User | Labs grid works on mobile |
| 014 | p6-labs-list | Lab Experimenter | 540 labs, overwhelming flat list |
| 015 | p6-lab-detail | Lab Experimenter | **UUID BREADCRUMB + LOADING SPINNER** |
| 016 | p7-certifications | Job Seeker | Clear tiers, but no "Start Path" CTA |
| 017 | p7-credential-verify | Job Seeker | Credential page works |
| 018 | p7-leaderboard | Job Seeker | Leaderboard works |
| 019 | p8-teams | Team Manager | Teams page works |
| 020 | p8-guilds | Team Manager | Guilds page works |
| 021 | p8-challenges | Team Manager | Challenges page works |
| 022 | p9-community | Community Explorer | Empty states need better CTAs |
| 023 | p9-master-classes | Community Explorer | Master classes page works |
| 024 | p10-admin-dashboard | Admin | Comprehensive admin panel |
| 025 | p10-admin-security | Admin | Security dashboard works |
| 026 | p10-admin-audit | Admin | Audit log works |
