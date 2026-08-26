# XpertClass vs HTB — Full Platform UI Critique

A page-by-page analysis of our XpertClass UI against Hack The Box's equivalent pages, identifying what's missing, what's wrong, and what we should learn.

---

## 1. Landing Page

**Our page:** `frontend/src/app/page.tsx`
**HTB equivalent:** HTB homepage (no direct screenshot — HTB's public landing)

### Layout comparison
- **Ours:** Full-width marketing page with sections: Hero → Skill Fusion Lab → Audience → Learning Paths → How It Works → Features → Labs → Master Classes → Training → Testimonials → Stats → CTA → Footer.
- **HTB:** Dark-themed, cyberpunk aesthetic. Hero with bold headline, stats bar, CTA buttons, and a more aggressive visual identity. Dark backgrounds, neon accents, and terminal-inspired design language throughout.

### Feature placement
- **Ours:** CTA is well-placed at hero, middle, and bottom. Good section flow.
- **HTB:** HTB puts the "Free Trail" CTA immediately visible and bold. Their stats (2M+ users, 50+ labs) are displayed prominently. We show ours in a grid on the right — less impactful.

### Component design
- **Ours:** Cards are light/white with subtle borders. Green accent (`#229C62`). Clean but feels like a SaaS B2B product.
- **HTB:** Cards use dark backgrounds with neon green/lime accents (`#9FEF00`). Terminal-style elements. Buttons have aggressive hover states. The entire aesthetic communicates "hacker culture."
- **What's wrong:** Our landing page looks like a generic EdTech product. HTB's looks like a cybersecurity platform. The visual language doesn't match the audience expectation. We should be darker, bolder, more technical.

### What's missing
- **Pricing section** — HTB clearly shows free vs. premium tiers. We only say "Free tier available."
- **Company logos / social proof** — HTB displays partner companies, universities. We have nothing like this.
- **Community stats** — HTB shows 2M+ users, 50+ challenges, etc. in a prominent bar. Our stats are hidden in a grid.
- **Terminal/hacker aesthetic** — HTB's entire visual identity screams "security." Ours screams "clean SaaS."

### Specific fixes
1. Make the hero section darker — use `#0F203A` or black as the base background
2. Add a prominent stats bar below the hero (students, labs, courses, countries)
3. Add a pricing/free tier comparison section
4. Add partner/company logos for social proof
5. Make the "How it Works" section more visual with actual terminal screenshots
6. Reduce the number of sections — we have 10+ sections. HTB's landing is tighter and more focused

---

## 2. Onboarding

**Our page:** `frontend/src/components/OnboardingOverlay.tsx` (overlay on dashboard)
**HTB equivalent:** HTB's 6-step onboarding wizard

### Layout comparison
- **Ours:** A 4-step modal overlay triggered when a new user visits the dashboard. Full-screen backdrop with a centered card. Steps: Welcome → 90% Hands-On Labs → Daily Missions → Ready!
- **HTB:** A dedicated full-page onboarding with left content + right sidebar (progress indicator + testimonial). 6 steps: Why joined → Field → Role → Experience → Skills → Job opportunities.

### Feature placement
- **Ours:** Steps are purely informational. No user input. Just "read this and click Next."
- **HTB:** Each step asks the user a question and presents clickable card options. Selected items get a lime green border + checkmark. The user's choices personalize their experience.
- **What's wrong:** Our onboarding is a tour, not an onboarding. HTB's onboarding actually collects data to customize the experience. Ours just shows slides.

### Component design
- **Ours:** Single centered card. Emoji at top. Dot indicators at bottom. Skip + Next buttons.
- **HTB:** Left side has the question and option cards. Right side has a progress circle (1/6) and a testimonial quote. Navigation: Back (left) | Skip (center) | Continue (right).

### What's missing
- **User input** — We don't ask the user any questions during onboarding
- **Personalization** — No field selection, role selection, experience level, or skill interests
- **Progress indicator** — HTB shows a clear 1/6 progress. We show dots but they're not labeled
- **Testimonial/quote** — HTB shows a user quote on the right sidebar. Adds social proof during onboarding
- **Full-page layout** — HTB uses a full-page layout. Ours is a small modal card — feels like an afterthought

### Specific fixes
1. Convert from overlay modal to a full `/onboarding` page
2. Add 6 steps: Why are you here → Your field (Security/Linux/DevOps) → Your role (Student/Professional/Educator) → Experience level → Skills you want to learn → Job opportunities interest
3. Each step should have clickable option cards with green border on selection
4. Add right sidebar with step counter and testimonial
5. Add Back/Skip/Continue navigation at the bottom
6. Save selections to user profile for personalization

---

## 3. Dashboard

**Our page:** `frontend/src/app/dashboard/page.tsx` → `CommandCenter.tsx`
**HTB equivalent:** HTB Dashboard (Profile page)

### Layout comparison
- **Ours:** Full-width single-column layout. Greeting → Progress Summary (4 stats) → This Week → Engineering Profile → Academic → Recommended → Quick Access (4 cards)
- **HTB:** Welcome message with user name, role, focus. Two main cards: HTB Academy + HTB Labs (with illustrations). Additional cards: LetsDefend, CTF.

### Feature placement
- **Ours:** Greeting hero at top (dark gradient). Stats row. Weekly items. Domain bars. Recommendations.
- **HTB:** Simpler layout. Two main product cards dominate. Less information density, more visual breathing room.

### Component design
- **Ours:** Dark gradient hero with "What's your next move?" — very motivational. Stats cards with icons and progress bars. Domain bars show skill distribution.
- **HTB:** Cards with product illustrations. Clean card-based layout. Each card is a distinct product offering.
- **What's wrong:** Our dashboard is too dense. We're trying to show everything at once. HTB's dashboard is a simple entry point to their products. Our dashboard feels like a command center (hence the name) but it overwhelms new users.

### What's missing
- **Product cards** — HTB has clear cards for "Academy," "Labs," "CTF," "For Business." We have Quick Access cards but they're smaller and less visual.
- **Illustrations** — HTB cards have custom illustrations. Ours are just icons.
- **"Don't know where to start?" prompt** — HTB helps new users. Our recommendations section does this but it's buried.
- **Simpler entry points** — HTB's dashboard is a launcher. Ours is a dashboard. Different mental models.

### Specific fixes
1. Add 2-3 large product cards (Academy, Labs, Compete) with illustrations and descriptions
2. Reduce information density — move weekly items and domain bars below the fold
3. Add a "Don't know where to start?" section that recommends a specific first action
4. Make the hero section less aggressive — "Good morning, X" is enough. "What's your next move?" adds pressure
5. Show a progress ring or circle instead of just a bar — more visual impact

---

## 4. Courses List

**Our page:** `frontend/src/app/dashboard/courses/page.tsx`
**HTB equivalent:** HTB Academy module list / Challenges page

### Layout comparison
- **Ours:** PageHeader → Search → Category filters → Difficulty filters → 3-column grid of course cards
- **HTB:** Tab filters (All/Active/Retired/Favorites/Unreleased) → Search + dropdown filters → Table layout (Challenge, Category, Difficulty, Rating, Solves, Release Date)

### Feature placement
- **Ours:** Search is a text input. Filters are pill buttons. Cards show image, title, difficulty dots, lesson count, and lock status.
- **HTB:** Search is a text input. Filters are dropdowns for Status, Difficulty, Category. Results are shown in a table, not cards.

### Component design
- **Ours:** Cards with cover image, category badge, difficulty dots, module count, and "Begin training" / "Resume" / "Locked" action.
- **HTB:** Table rows with: Challenge name + Staff Pick badge, Category, Difficulty (dots), Rating, Solves count, Release date.
- **What's wrong:** Our card layout is good for browsing but we're missing critical data points that HTB shows in their table: Rating, Number of Solves, and Release Date. We also don't have "Staff Pick" badges.

### What's missing
- **Rating column** — HTB shows star ratings for each challenge
- **Solve count** — HTB shows how many people solved it (social proof)
- **Release date** — When was it published
- **Staff Pick badge** — Curated highlights
- **Tab filters** — HTB has "All/Active/Retired/Favorites/Unreleased" tabs. We only have category pills
- **Table view option** — HTB uses a table. We're all cards. A table view would be useful

### Specific fixes
1. Add rating and solve count to course cards
2. Add "Staff Pick" or "Featured" badge
3. Add tab filters: All | In Progress | Completed | Bookmarked
4. Consider adding a table view toggle
5. Show enrollment count or completion count for social proof

---

## 5. Course Detail

**Our page:** `frontend/src/app/dashboard/courses/[id]/page.tsx`
**HTB equivalent:** HTB Academy module page / Machine detail page

### Layout comparison
- **Ours:** Hero header (gradient) → Tab bar (Overview/Lessons/Progress) → Content area. Overview has "What you'll learn," Reviews, Discussions. Lessons has expandable modules. Progress has progress bar + resume.
- **HTB:** Machine detail with: Machine name + difficulty badge + rating + XP reward → Tabs (Play, Info, Walkthroughs, Reviews, Activity, Changelog) → Play tab has Start Machine button + connection options.

### Feature placement
- **Ours:** Hero shows title, description, estimated time, module count, lesson count. Tabs below.
- **HTB:** Header shows name, difficulty, rating, XP reward. Tabs below. Right sidebar has related content.
- **What's wrong:** We don't show XP reward prominently. We don't show a difficulty badge in the hero. We don't have a Walkthroughs tab or Activity tab.

### Component design
- **Ours:** Gradient hero with course info. Tab bar is minimal. Content sections are card-based.
- **HTB:** Dark header with machine details. Tabs are more prominent. Play tab has connection options (Pwnbox, OpenVPN).
- **What's wrong:** Our tabs are Overview/Lessons/Progress. HTB has Play/Info/Walkthroughs/Reviews/Activity/Changelog. We're missing Walkthroughs, Activity, and Changelog. We also don't have connection options because our labs are in-browser.

### What's missing
- **XP reward in hero** — HTB shows "+X XP" prominently
- **Rating in header** — Star rating displayed at the top
- **Walkthroughs tab** — Community-submitted walkthroughs
- **Activity tab** — Recent activity/updates
- **Changelog tab** — Version history
- **Related content sidebar** — HTB shows related machines on the right

### Specific fixes
1. Add XP reward to the hero header
2. Add star rating to the hero header
3. Add a Walkthroughs tab for community guides
4. Add an Activity tab showing recent completions
5. Add a sidebar with related courses

---

## 6. Lesson View

**Our page:** `frontend/src/app/dashboard/courses/lessons/[id]/page.tsx`
**HTB equivalent:** HTB Academy lesson page

### Layout comparison
- **Ours:** Hero header (gradient) → 8/4 grid: Main content (video + markdown + quiz) + Sidebar (lab link + lesson info)
- **HTB:** Clean dark content area → Section counter (Section 1/8) → Progress bar → "Mark Complete & Next" with +10 XP

### Feature placement
- **Ours:** Video player at top, markdown content below, quiz at bottom. Sidebar has lab link and lesson info.
- **HTB:** Content is the hero. Section counter and progress are always visible. "Mark Complete & Next" is a prominent action.
- **What's wrong:** Our "Mark as complete" button is in the hero header, which is good. But we don't show XP reward or section progress like HTB does. HTB's lesson view is more focused — just content + completion action.

### Component design
- **Ours:** Video player (ReactPlayer), markdown renderer (ReactMarkdown), quiz component. Sidebar with lab link.
- **HTB:** Clean content area with code blocks, terminal commands, interactive elements. Section navigation is built into the page.
- **What's wrong:** We don't show "Section X / Y" prominently. We don't show a progress bar for the course. We don't show XP reward for completing the lesson.

### What's missing
- **Section counter** — "Section 1 / 8" at the top
- **Course-level progress bar** — How far through the course am I?
- **XP reward display** — "+10 XP" next to Mark Complete
- **Previous/Next navigation** — Easy jump to adjacent lessons
- **Terminal simulation** — HTB has interactive terminal elements in lessons. Ours is just markdown

### Specific fixes
1. Add "Section X / Y" counter at the top of the page
2. Add a course-level progress bar below the hero
3. Show "+10 XP" next to the "Mark Complete" button
4. Add Previous/Next lesson navigation at the bottom
5. Consider adding interactive terminal elements for technical content

---

## 7. Labs List

**Our page:** `frontend/src/app/dashboard/labs/page.tsx`
**HTB equivalent:** HTB Challenges page / Starting Point

### Layout comparison
- **Ours:** PageHeader → Search → Difficulty filters → Progress filters → 3-column grid of lab cards
- **HTB:** Tab filters → Search + dropdowns → Table layout with: Machine, Difficulty, Rating, Status, Solves

### Feature placement
- **Ours:** Search input. Difficulty pill buttons. Progress pill buttons. Cards with difficulty bar, title, description, flag count, progress bar, and "Launch" action.
- **HTB:** Search + filter dropdowns. Table with columns. Each row shows machine name, difficulty dots, rating, status, solves.
- **What's wrong:** We use cards, HTB uses a table. Cards are better for visual browsing. But we're missing rating, solve count, and status columns that HTB shows.

### Component design
- **Ours:** Cards with a colored top bar (difficulty), title, description, flag progress, and launch button. Locked labs show a blurred overlay with lock icon.
- **HTB:** Table rows with clear columns. Difficulty shown as colored dots. Rating as stars. Status as badge.
- **What's wrong:** Our locked state is good (blurred overlay with lock). But we don't show rating or solve count. We also don't have a "Staff Pick" badge.

### What's missing
- **Rating** — Star rating for each lab
- **Solve count** — How many people completed it
- **Staff Pick badge** — Curated highlights
- **Status column** — Not started / In progress / Completed (we have this as a filter but not in the card)
- **Table view** — Alternative to card grid

### Specific fixes
1. Add rating and solve count to lab cards
2. Add "Staff Pick" or "Featured" badge
3. Add a status indicator (not just filter)
4. Consider a table view option
5. Show estimated completion time more prominently

---

## 8. Master Classes

**Our page:** `frontend/src/app/dashboard/master-classes/page.tsx`
**HTB equivalent:** No direct HTB equivalent (HTB doesn't have master classes)

### Layout comparison
- **Ours:** PageHeader → Search → Category filters → 3-column grid of master class cards
- **HTB:** N/A — This is a unique XpertClass feature

### Feature placement
- **Ours:** Cards with gradient header, category badge, title, description, instructor, date, registration count
- **HTB:** N/A

### Component design
- **Ours:** Purple-to-green gradient header. LIVE badge for live classes. Recorded badge for recordings. Duration shown. Status badge (UPCOMING/LIVE/COMPLETED).
- **What's wrong:** The gradient header is nice. But the cards feel generic. There's no sense of urgency or excitement. Live classes should feel more alive.

### What's missing (compared to best practices, not HTB)
- **Countdown timer** for upcoming classes
- **"X spots left"** urgency indicator
- **Instructor photo/avatar** — just a name isn't enough
- **"Add to calendar" button** — important for live events
- **Registration confirmation** — clear feedback after registering

### Specific fixes
1. Add countdown timer for upcoming master classes
2. Add spots remaining indicator
3. Add instructor avatar/photo
4. Add "Add to Calendar" button
5. Make the LIVE badge more prominent with a pulse animation

---

## 9. Rankings / Leaderboard

**Our page:** `frontend/src/app/dashboard/leaderboard/page.tsx`
**HTB equivalent:** HTB Rankings page

### Layout comparison
- **Ours:** Global rank banner → League tabs (GLOBAL/REGIONAL/UNIVERSITY/TEAMS) → Time filter → Domain filter → Search → Season info → Level progress → Leaderboard list
- **HTB:** Tab filters (Hall of Fame/Teams/Universities/Countries/VIP) → Search → Table: Rank, Player (avatar+name+rank), Country (flag), Points, Users, Systems, Challenges, Fortresses. User's own rank top-right.

### Feature placement
- **Ours:** User's global rank is shown in a dark banner at the top. Tabs for different leagues. Time and domain filters. Level progress card. Then the leaderboard list.
- **HTB:** User's own rank is shown in the top-right corner. Tabs for different categories. Search. Then a comprehensive table.

### Component design
- **Ours:** Cards in a list. Each card shows rank number, avatar circle, username, division badge, organization, city, and points. Top 3 get trophy icons.
- **HTB:** Table with clear columns: Rank, Player (avatar + name + division), Country (flag), Points, Users, Systems, Challenges, Fortresses.
- **What's wrong:** Our leaderboard is good but we're missing columns that HTB shows: country flags, breakdown by category (users/systems/challenges). We also don't show the user's own rank prominently in the header.

### What's missing
- **Country flags** — HTB shows country flags next to each player
- **Category breakdown** — HTB shows Points, Users, Systems, Challenges, Fortresses separately
- **User's own rank pinned** — HTB shows your rank in the top-right. Ours is in the list but you have to scroll to find it
- **VIP tab** — HTB has a VIP leaderboard
- **University leaderboard** — We have this but it's a tab, not a dedicated page

### Specific fixes
1. Pin the user's own rank at the top of the leaderboard (not just in the list)
2. Add country flags next to usernames
3. Add a breakdown column showing XP by category
4. Make the rank numbers more prominent — use medal icons for top 3
5. Add a "Where am I?" button that scrolls to your position

---

## 10. Teams

**Our page:** `frontend/src/app/dashboard/teams/page.tsx`
**HTB equivalent:** HTB Teams page (under Rankings)

### Layout comparison
- **Ours:** Three views: 1) No team — Browse/Create/Join. 2) My team — Header + stats + members + courses. 3) Team detail — Header + description + stats + invite code + leaderboard + courses.
- **HTB:** Teams tab within Rankings. Table: University Name, Respects, Members, Country. Add University CTA.

### Feature placement
- **Ours:** Full team management: Create, Join, Customize (avatar, banner, colors), Leave, Edit. Detailed team view with member leaderboard.
- **HTB:** Simpler team listing. Add University CTA. HTB Education CTA.

### Component design
- **Ours:** Team cards with gradient banners, avatar, motto, owner, member count, XP. Create form with color presets, avatar upload, banner upload. Team detail with member leaderboard.
- **HTB:** Table-based listing. Simpler. More institutional.
- **What's wrong:** Our teams feature is actually more advanced than HTB's. We have customization (colors, avatars, banners), invite codes, and member leaderboards. But the UI is overwhelming. There are too many states and too much information.

### What's missing
- **Team ranking** — We have this in the leaderboard, but not prominently in the teams page
- **Team activity feed** — What have team members been doing?
- **Team challenges** — Challenges that teams can do together
- **Team chat** — Communication within the team

### Specific fixes
1. Simplify the three-view structure — use tabs instead of conditional rendering
2. Add a team activity feed
3. Make the invite code more prominent and easier to share
4. Add team-level challenges or competitions
5. Reduce the number of form fields in create/edit — start with name and description, add customization later

---

## 11. Settings

**Our page:** `frontend/src/app/dashboard/settings/page.tsx`
**HTB equivalent:** HTB Account Settings

### Layout comparison
- **Ours:** Left sidebar (Account/Notifications/Security/Appearance) → Right content area. Account has Profile, Danger Zone. Notifications has email toggles. Security has Password, Sessions. Appearance says "light theme only."
- **HTB:** More comprehensive settings. Account, Billing, Notifications, API tokens, etc.

### Feature placement
- **Ours:** Clean left nav with sections. Content area shows relevant settings for each section.
- **HTB:** Similar left nav pattern. More sections (Billing, API, etc.)

### Component design
- **Ours:** White cards with rounded borders. Toggle switches for notifications. Edit links for profile fields. Delete account with confirmation modal.
- **HTB:** Similar pattern. Dark theme. More sections.
- **What's wrong:** Our settings page is functional but the Appearance section is empty ("dark mode not supported"). This is a missed opportunity. Also, we're importing Sidebar and BottomNav directly in the settings page, which means it doesn't use the dashboard layout. This is inconsistent.

### What's missing
- **Dark mode** — The Appearance section explicitly says "not supported." HTB has dark mode by default.
- **API tokens section** — For developers
- **Billing/Subscription** — Even if we're free now, this is needed
- **Two-factor authentication** — Security section only has password change
- **Session management** — We only show "currently signed in." HTB shows all sessions with ability to revoke

### Specific fixes
1. Add dark mode support (at least a toggle)
2. Add 2FA setup in Security section
3. Add session management (list of active sessions)
4. Fix the layout — settings should use the dashboard layout, not import Sidebar/BottomNav directly
5. Add API tokens section for future extensibility

---

## 12. Admin Dashboard

**Our page:** `frontend/src/app/dashboard/admin/page.tsx`
**HTB equivalent:** HTB Admin Panel (not publicly visible)

### Layout comparison
- **Ours:** PageHeader → Stats grid (6 cards) → Quick Actions grid (20 cards)
- **HTB:** N/A — HTB's admin is not public

### Feature placement
- **Ours:** Stats at top (Students, Courses, Labs, Master Classes, Trainers, Total Users). Then a grid of 20 management links.
- **HTB:** N/A

### Component design
- **Ours:** Stat cards with icons and values. Quick action cards with icon, title, description, and arrow. Icons turn white on hover.
- **What's wrong:** The quick actions grid is overwhelming. 20 cards in a 3-column grid means 7 rows. It's a wall of links. HTB's admin would likely be more organized with sections/groups.

### What's missing
- **Section grouping** — Group the 20 links into categories (Content, Analytics, Users, System)
- **Recent activity** — What happened recently on the platform
- **System health** — Server status, Docker status, database size
- **Quick stats with charts** — Not just numbers, but trends

### Specific fixes
1. Group the 20 quick actions into sections: Content Management, User Management, Analytics, System
2. Add a recent activity feed
3. Add system health indicators
4. Add trend arrows to stat cards (up/down from last week)
5. Reduce the number of visible quick actions — show top 8, with "Show all" expand

---

## 13. Sidebar

**Our page:** `frontend/src/components/Sidebar.tsx`
**HTB equivalent:** HTB left sidebar (collapsed)

### Layout comparison
- **Ours:** Fixed left sidebar (w-60). Logo at top. Alerts section. Navigation sections with expand/collapse. Level/XP progress bar at bottom. Profile, Settings, Language, Logout at bottom.
- **HTB:** Collapsible left sidebar. Icons only when collapsed. Expanded on hover. Navigation items with labels.

### Feature placement
- **Ours:** Logo → Experience badge → Alerts → Nav sections → Level progress → Profile/Settings/Language/Logout
- **HTB:** Logo → Nav items (icons) → User menu at bottom

### Component design
- **Ours:** White background. Active state: green background. Expandable sections with chevron. Level progress bar at bottom with dark gradient.
- **HTB:** Dark background. Icons only. Collapsible. More compact.
- **What's wrong:** Our sidebar is wider (w-60) and always expanded. HTB's is collapsible. Our sidebar has too many items visible at once. The alerts section at the top takes up valuable space.

### What's missing
- **Collapsible sidebar** — HTB can collapse to icons only
- **Search in sidebar** — Quick search from the sidebar
- **Notifications count** — Badge on notification icon
- **User avatar** — HTB shows the user's avatar in the sidebar. We show a text name

### Specific fixes
1. Make the sidebar collapsible (icons only mode)
2. Add user avatar next to the Profile link
3. Move alerts to a notification bell instead of inline in the sidebar
4. Add a notification count badge
5. Consider a darker sidebar theme to match the cybersecurity aesthetic

---

## 14. Bottom Nav (Mobile)

**Our page:** `frontend/src/components/BottomNav.tsx`
**HTB equivalent:** HTB mobile navigation

### Layout comparison
- **Ours:** Fixed bottom bar (md:hidden). 5 icons: Home, Learn, Labs, Compete, Me.
- **HTB:** Similar bottom nav on mobile. Icons with labels.

### Feature placement
- **Ours:** 5 items matching the main navigation sections. Active state in green.
- **HTB:** Similar pattern.

### Component design
- **Ours:** Simple icon + label. Active state changes color to green.
- **What's wrong:** Our bottom nav is functional but basic. It doesn't have a notification badge or any visual distinction for items with new content.

### What's missing
- **Notification badge** — Red dot on items with new activity
- **Active indicator** — A dot or bar below the active item (not just color change)
- **Haptic feedback** — On mobile, visual feedback on tap

### Specific fixes
1. Add notification badges to relevant items
2. Add a small active indicator dot below the active item
3. Add a pressed/active state animation

---

## 15. Dashboard Layout

**Our page:** `frontend/src/app/dashboard/layout.tsx`
**HTB equivalent:** HTB app shell

### Layout comparison
- **Ours:** DisplayModeProvider → NavigationProvider → DashboardSocketProvider → Container with Sidebar + NotificationBell + Main content + BottomNav + LearningCoach
- **HTB:** Similar shell with sidebar + main content

### Feature placement
- **Ours:** Sidebar on left. Main content with breadcrumbs and error boundary. BottomNav on mobile. LearningCoach (AI) overlay. NotificationBell.
- **HTB:** Sidebar + main content. Notifications in header.

### Component design
- **Ours:** White background (`bg-slate-50`). Max width 6xl. Padding responsive.
- **HTB:** Dark background. Full width content.
- **What's wrong:** The layout is functional. But we're missing a header bar. HTB has a top header with search, notifications, help, and user menu. We only have a notification bell floating.

### What's missing
- **Top header bar** — Search, notifications, help, user menu
- **Breadcrumb navigation** — We have this but it's minimal
- **Global search** — HTB has a search bar in the header. We don't
- **User menu in header** — HTB shows avatar + dropdown in top-right. We have it in the sidebar

### Specific fixes
1. Add a top header bar with: Search, Notifications, Help, User menu
2. Move the user avatar from sidebar to header (or both)
3. Add a global search shortcut (Cmd+K)
4. Make the breadcrumbs more prominent

---

## 16. Login

**Our page:** `frontend/src/app/login/page.tsx`
**HTB equivalent:** HTB login page

### Layout comparison
- **Ours:** Split layout: Left form (white) + Right marketing (green gradient). Form has Google SSO, email/password, forgot password link.
- **HTB:** Similar split layout. Dark theme. Form on one side, branding on the other.

### Feature placement
- **Ours:** Logo → Welcome back → Google button → Divider → Email/Password form → Sign in button → Create account link. Right side has feature cards.
- **HTB:** Logo → Login form → SSO options. Right side has branding/illustration.

### Component design
- **Ours:** White form area with green gradient marketing side. Clean inputs with icons. Google SVO button. Feature cards on the right.
- **HTB:** Dark theme. Similar split layout. More minimal marketing side.
- **What's wrong:** Our login page is good. The split layout is standard. But the green gradient on the right feels generic. HTB's dark theme is more on-brand for cybersecurity.

### What's missing
- **Remember me checkbox** — We don't have this
- **Social login options** — We have Google only. HTB has more
- **"New here?" prompt** — More prominent registration CTA
- **Security branding** — The marketing side should emphasize security/hacking, not generic features

### Specific fixes
1. Add a "Remember me" checkbox
2. Change the right side to a darker, more cybersecurity-themed design
3. Add more social login options (GitHub is important for developers)
4. Make the marketing side more visually striking — use terminal screenshots, not feature cards

---

## 17. Register

**Our page:** `frontend/src/app/register/page.tsx`
**HTB equivalent:** HTB registration page

### Layout comparison
- **Ours:** Split layout: Left marketing (green gradient) + Right form. Form has Google SSO, name/email/password/confirm, password strength indicator.
- **HTB:** Similar split layout. Dark theme.

### Feature placement
- **Ours:** Benefits list on the left. Form on the right. Google SSO. Password strength bar.
- **HTB:** Registration form with minimal marketing. More focused on getting the user signed up.

### Component design
- **Ours:** Green gradient left side with benefits checklist. White form right side. Password strength indicator with colored bars.
- **What's wrong:** Our registration is clean. The password strength indicator is good. But the benefits list on the left is generic. HTB's registration is more focused.

### What's missing
- **Terms of service checkbox** — We don't have this (legal requirement in many jurisdictions)
- **Password requirements visible** — We show them in error messages but not upfront
- **Email verification step** — We redirect to verification but the flow isn't clear
- **"Already have an account?" link** — We have this but it could be more prominent

### Specific fixes
1. Add a "I agree to Terms of Service" checkbox
2. Show password requirements upfront (not just in error messages)
3. Make the email verification step clearer
4. Add a progress indicator for the registration flow (Register → Verify → Onboard)

---

## Summary of Cross-Cutting Issues

### 1. Visual Identity
**Problem:** Our UI looks like a clean SaaS product. HTB's looks like a cybersecurity platform.
**Fix:** Adopt a darker theme, use terminal-inspired elements, add neon/lime accents, use monospace fonts for technical content.

### 2. Information Density
**Problem:** We pack too much into every page. HTB is more selective about what to show.
**Fix:** Reduce information density. Show less, make it more impactful. Use progressive disclosure.

### 3. Social Proof
**Problem:** We're missing ratings, solve counts, user counts, and testimonials in key places.
**Fix:** Add ratings to courses/labs. Show solve counts. Add user testimonials on the dashboard.

### 4. Gamification Visibility
**Problem:** XP, levels, and rewards are present but not prominent enough.
**Fix:** Show XP rewards more prominently. Add animated XP gain notifications. Show level-up celebrations.

### 5. Mobile Experience
**Problem:** Our mobile bottom nav is basic. Settings page imports its own Sidebar/BottomNav.
**Fix:** Standardize the mobile experience. Fix the settings page to use the dashboard layout.

### 6. Dark Mode
**Problem:** We don't support dark mode. The Appearance settings say "not supported."
**Fix:** Add dark mode support. This is critical for a cybersecurity platform.

### 7. Header Bar
**Problem:** We don't have a top header bar with search, notifications, and user menu.
**Fix:** Add a header bar to the dashboard layout. Include global search, notifications, and user avatar.

### 8. Onboarding Personalization
**Problem:** Our onboarding is a tour. HTB's onboarding collects user preferences.
**Fix:** Redesign onboarding to collect field, role, experience, and skill preferences.
