# HackTheBox UI Dissection — Design Principles for XpertClass

A layout, placement, and component design analysis of HackTheBox's interface, extracted from screenshot observation and translated into actionable principles.

---

## 1. FEATURE PLACEMENT — Where Things Go and Why

### Principle: The F-Pattern Hero with Asymmetric Weight

**HTB does:** Hero text (headline + subtitle + CTA) on the LEFT. Product mockup/screenshot on the RIGHT. The left side carries the message; the right side carries the proof.

**Why it works:** Western readers scan in an F-pattern — top-left to top-right, then down the left side. The headline grabs attention first (it's the heaviest visual element). The product mockup on the right acts as a "confirmation" — the eye moves from "what is this?" to "what does it look like?" without crossing back.

**XpertClass lesson:** Your current hero (`page.tsx:216-277`) has text left, stat cards right. This is correct. But the stat cards are generic (numbers in boxes). HTB shows the actual product interface — a terminal, a dashboard, a challenge view. Replace the stat grid with a real product screenshot or terminal mockup. Show, don't tell. Your lab showcase section (`page.tsx:424-480`) does this with a terminal — move that visual UP into the hero.

### Principle: Trust Signals Between Hero and Features

**HTB does:** After the hero, before any feature section, there's a row of company logos (Deloitte, Toyota, Siemens, Google). Not at the bottom. Not in a sidebar. Directly between the hero and the first content section.

**Why it works:** This is a "credibility bridge." The hero makes a claim ("Master technologies"). The logos answer the immediate skeptic's question: "Who else trusts this?" By placing them here, HTB creates a psychological transition from "I'm interested" to "I should keep reading." If logos were at the bottom, the user would have already made up their mind.

**XpertClass lesson:** You have no trust signals section. Add a logo bar between the hero and SkillFusionLab. Even if you don't have enterprise clients yet, use "Built with" tech badges (you already have these in the footer) or "Instructor credentials" or "Student count" as social proof. Place it at `page.tsx:280`, before `SkillFusionLab`.

### Principle: Pricing Inside the Hero (Not After)

**HTB does:** On the Pro Labs page, the pricing card (annual/monthly toggle, price, CTA) sits INSIDE the hero section, right next to the headline "Go Beyond Simulated. Go Real."

**Why it works:** Pro Labs is a paid product. HTB doesn't hide the price behind a click. By showing it in the hero, they filter the audience immediately: "This is premium. Here's the price. If you're interested, keep reading." It eliminates the "how much does this cost?" anxiety that would otherwise follow the user through the entire page.

**XpertClass lesson:** You have a free tier and enterprise pricing. Your CTA section (`page.tsx:640-658`) says "No credit card required" but doesn't show pricing. For enterprise/training pages, consider showing a pricing tier card in the hero area. For the main landing page, the "Start Free" CTA is sufficient — but the enterprise section should surface pricing earlier.

### Principle: Content Type Determines Layout (Grid vs Table vs Cards)

**HTB does:**
- **Tracks** → Grid of cards (visual, browsable, low information density per item)
- **Challenges** → Table with columns (high information density, comparison needed)
- **Rankings** → Table with columns (precise data, sorting needed)
- **Pro Labs** → Hero + cards (marketing-oriented, not comparison)
- **Seasonal** → Hero + tabs (event-oriented, time-sensitive)

**Why it works:** Each content type has different user needs. Tracks are about discovery — you browse visually. Challenges are about selection — you compare difficulty, category, solve count. Rankings are about data — you need precise numbers. The layout matches the cognitive task.

**XpertClass lesson:** Your courses page (`courses/page.tsx:267`) uses a grid of cards. This is correct for courses — they're visual, browsable, have images. But if you add a "challenges" or "labs" listing page, use a TABLE format with columns for: Lab Name, Category, Difficulty (dots), Status (locked/available/in-progress), Estimated Time. Don't force everything into cards.

---

## 2. UX FLOW — How Users Move Through the Interface

### Principle: The Two-Click Rule for Primary Actions

**HTB does:** From any page, you're at most 2 clicks from starting an activity. Landing page → "Get Started" → Onboarding step. Labs page → Machine card → "Start Machine." Academy → Module → "Start Lesson."

**Why it works:** Every unnecessary click is a dropout point. HTB's primary CTAs are always visible, always the heaviest button on the page, and always lead directly to the next action — not to another landing page.

**XpertClass lesson:** Your flow is: Landing → Get Started → Onboarding → Dashboard → Courses → Course → Section → Lesson. That's 7 clicks from landing to first lesson. Consider: Landing → "Start Learning" → (auto-enroll in first course) → Lesson. Reduce friction for new users by auto-enrolling them in a recommended course during onboarding.

### Principle: Progressive Disclosure Through Tabs

**HTB does:** Machine detail page has tabs: Play, Info, Walkthroughs, Reviews, Activity, Changelog. "Play" is first and shows the Start Machine button immediately. Everything else is hidden behind a tab click.

**Why it works:** A machine page has a LOT of information. If everything were shown at once, the user would be overwhelmed. Tabs let HTB show the most important thing first (the action) and let users dig deeper only when they want to. The tab order is deliberate: Action → Context → Social → History.

**XpertClass lesson:** Your course detail page shows everything at once (sections, lessons, progress). Consider tabbing the course detail view: "Lessons" (primary), "Overview" (description, prerequisites), "Discussion" (future). This reduces visual noise and focuses the user on what matters: starting the next lesson.

### Principle: Back/Skip/Continue Navigation in Onboarding

**HTB does:** Onboarding has 3 navigation options: Back (left), Skip (center), Continue (right). The progress indicator is on the RIGHT side of the screen, not at the top.

**Why it works:**
- **Back on left** matches the mental model of "going back" (left = past in Western culture)
- **Continue on right** matches "going forward" (right = future)
- **Skip in center** is deliberately less prominent — it's available but not competing with Continue
- **Progress on right** keeps the main content area clean and centered. Progress is supplementary information, not the primary focus.

**XpertClass lesson:** If you build an onboarding flow, use this exact pattern. Don't put a progress bar at the top — it steals vertical space from the actual content. Put it in a sidebar or right-aligned panel.

### Principle: The "Mark Complete & Next" Button with XP Reward

**HTB does:** Academy lesson view has a single prominent button: "Mark Complete & Next" with "+10 XP" shown directly on the button.

**Why it works:** This combines two motivations in one element: completion (intrinsic) and reward (extrinsic). The user doesn't have to wonder "what do I get?" — it's right there. The button also says "Next" — it doesn't just complete, it advances. This prevents the "what now?" moment after finishing a lesson.

**XpertClass lesson:** Your lesson view should have a button that says "Complete & Continue" with the XP reward visible. Don't make the user complete a lesson and then navigate separately to the next one. Merge completion and advancement into a single action.

---

## 3. COMPONENT DESIGN — How Individual Components Work

### Tab Design

**HTB does:** Underline tabs, not pill tabs. The active tab has a colored underline (lime green). Inactive tabs are plain text. No backgrounds, no borders, no rounded corners on the tabs themselves.

**Why it works:** Underline tabs are visually lightweight. They don't compete with the content below them. Pill tabs (like your current `page.tsx:332-341`) add visual weight and create a "button row" that competes with the actual page content. Underline tabs say "these are navigation labels." Pill tabs say "these are actions."

**XpertClass lesson:** Replace pill tabs with underline tabs in the Learning Paths section. The active tab should have a 2-3px bottom border in `#229C62`. Inactive tabs should be `text-slate-500` with no background. This will make the tab content area feel more spacious and less cluttered.

### Card Design

**HTB does:** Cards have: image/icon area (top or left), title (bold, 14-16px), subtitle/meta (smaller, muted), action area (button or link). Cards are uniform in height within a row. Badges sit on top of images (absolute positioned, top-left or top-right).

**Why it works:** The eye scans: Visual → Title → Meta → Action. This is a consistent Z-pattern within each card. Badges on images save space and create visual hierarchy — the badge is "part of" the item, not a separate element.

**XpertClass lesson:** Your course cards (`courses/page.tsx:284-397`) follow this pattern well. The category badge on the image is correct. But the difficulty dots are below the title — consider moving them next to the title (inline) to save vertical space. Also, the "Resume" / "Begin training" action at the bottom of each card is good — keep that pattern consistent.

### Table Design

**HTB does:** Tables use: alternating row backgrounds (subtle), left-aligned text, right-aligned numbers, colored difficulty indicators (not text), avatar + name in a single column, flags for country.

**Why it works:**
- **Alternating rows** help the eye track across wide tables
- **Left-aligned text** is natural for reading
- **Right-aligned numbers** align decimal points for comparison
- **Colored indicators** (dots, badges) are faster to parse than text labels
- **Avatar + name** in one column saves space and creates visual identity
- **Flags** are universally recognized and save the space a text country name would need

**XpertClass lesson:** When you build a labs listing or admin table, use these patterns. Don't use text for difficulty — use colored dots (like your `DIFFICULTY_MAP` in `courses/page.tsx:31-37` but as dots, not labels). For any list with 5+ columns, use a table, not cards.

### Badge Design

**HTB does:** Badges are: small (10-12px text), rounded-full, have a colored background + colored text (same hue, different saturation), always inline with adjacent text. Difficulty badges use a colored dot + text.

**Why it works:** Badges are metadata — they should be scannable but not dominant. Rounded-full with small text makes them feel like labels, not buttons. Colored backgrounds make them visually distinct from surrounding text without requiring the user to read them.

**XpertClass lesson:** Your category badges (`courses/page.tsx:308-312`) are correct: small, uppercase, colored bg + colored text. Keep this pattern. Add difficulty badges next to course titles (not just in the card body) so users can scan difficulty without reading each card.

### Button Design

**HTB does:** Primary buttons: solid colored background (green), white text, medium weight, slight rounded corners. Secondary buttons: outline or ghost style. Primary CTA is always the most visually heavy element in its section. Buttons have consistent padding across the entire interface.

**Why it works:** The primary button should be the FIRST thing the eye catches in any section. If a secondary button is equally heavy, the user has to think about which to click. By making the primary button dominant, HTB guides the user to the intended action without conscious decision-making.

**XpertClass lesson:** Your `btn-primary` and `btn-secondary` classes are consistent. But check: is your primary CTA always the heaviest visual element in its section? In the hero (`page.tsx:229-235`), both buttons are similar weight. Make "Start Learning Free" solid green and "Explore Labs" a ghost button (no background, just text + icon). This creates a clear primary/secondary hierarchy.

---

## 4. INFORMATION ARCHITECTURE — How Content Is Organized

### Principle: The 3-Layer Content Hierarchy

**HTB does:**
1. **Layer 1 — Marketing (Landing page):** What is this? Why should I care? → Hero + Trust + Features
2. **Layer 2 — Discovery (Dashboard):** What do I do first? What's available? → Welcome + Recommendations + Lists
3. **Layer 3 — Depth (Detail pages):** How does this specific thing work? → Tabs + Content + Actions

**Why it works:** Users enter at Layer 1, orient at Layer 2, and engage at Layer 3. Each layer has a different information density and different UI patterns. Mixing layers (e.g., showing Layer 3 depth on a Layer 1 page) overwhelms the user.

**XpertClass lesson:** Your landing page is Layer 1 (correct). Your dashboard should be Layer 2 — show: "Welcome back, [name]" + "Continue where you left off" + "Recommended next" + quick stats. Don't show full course details on the dashboard. Your course detail page is Layer 3 — show full curriculum, progress, and actions. Keep these layers distinct.

### Principle: Sidebar as Navigation, Not Content

**HTB does:** The sidebar is collapsed (icon-only or narrow). It shows: Home, Labs, Academy, Challenges, Pro Labs, Community. It does NOT show user stats, progress, or notifications. Those are in the header or main content area.

**Why it works:** The sidebar is for MOVEMENT between sections. It should be scannable in under 1 second. If the sidebar contains progress, stats, or notifications, it becomes a content area and competes with the main content for attention.

**XpertClass lesson:** Your sidebar (`Sidebar.tsx`) is good — it's navigation-only. But the "Level X / XP" progress card at the bottom (`Sidebar.tsx:291-304`) adds content to the navigation area. Move the XP/Level display to the top-right of the main content area (like HTB shows the user's global ranking top-right on the rankings page). Keep the sidebar pure navigation.

### Principle: Right Sidebar for Supplementary Data

**HTB does:** Machine detail pages show related content/recommendations in a right sidebar. The Academy dashboard shows Level/XP/Streak/Progress in a right sidebar. The right sidebar is ALWAYS supplementary — never the primary content.

**Why it works:** The left/center of the page is where the user's attention goes first. The right sidebar is for "while you're here, you might also want to know..." It's context, not content. This creates a natural reading flow: primary content (left/center) → supplementary info (right).

**XpertClass lesson:** Your dashboard layout (`layout.tsx:54`) has a single-column main content area. Consider adding a right sidebar to the dashboard showing: Level + XP progress bar, Current streak, Quick stats. This gives returning users immediate orientation without cluttering the main content.

---

## 5. VISUAL HIERARCHY — What the Eye Sees First

### Principle: Size = Importance

**HTB does:**
- Hero headline: 48-64px, bold, white or high-contrast
- Section headlines: 32-40px, bold
- Card titles: 16-18px, semibold
- Meta text: 12-14px, regular weight, muted color
- Badges: 10-12px, uppercase, colored

**Why it works:** Size is the strongest visual hierarchy cue. The user's eye goes to the largest text first, then progressively smaller. This creates a natural reading order without requiring explicit numbering.

**XpertClass lesson:** Your hero headline (`page.tsx:222-224`) is `text-5xl sm:text-6xl lg:text-7xl` — this is correct. But your section headlines are all the same size (`text-4xl sm:text-5xl`). Consider varying section headline sizes: primary sections (Learning Paths, Labs) at 40-48px, secondary sections (Testimonials, Stats) at 32-36px. This creates visual rhythm.

### Principle: Color = Action

**HTB does:** Interactive elements (buttons, links, active states) use a single accent color (lime green). Everything else is neutral (white, gray, dark). The accent color is NEVER used for decorative purposes — it always means "clickable" or "active."

**Why it works:** When one color = one meaning, the user learns the visual language instantly. Green means "go/click/active." If green were also used for backgrounds, borders, and decorative elements, the user would have to parse each green element to determine if it's interactive.

**XpertClass lesson:** Your `#229C62` is used for: buttons, active states, badges, decorative gradients, backgrounds, borders. This dilutes its meaning. Reserve `#229C62` exclusively for interactive elements and active states. Use `#E9F8EE` (your pale green) for decorative backgrounds. Use `#0F203A` for static text. This creates a clearer visual language.

### Principle: Whitespace = Breathing Room

**HTB does:** Sections have 80-120px vertical padding. Cards have 24-32px internal padding. Between elements within a card, there's 8-16px. Between cards in a grid, there's 16-24px.

**Why it works:** Whitespace is not empty space — it's a design element. Large section padding (80-120px) creates clear separation between content blocks, making each section feel like a distinct "chapter." Tight internal padding (8-16px) creates visual grouping within cards.

**XpertClass lesson:** Your section padding is `py-28` (112px) — this is correct and generous. Your card padding is `p-5` to `p-8` — also good. Check the space between your filter rows (`courses/page.tsx:165-234`) — they use `space-y-4` (16px). This might be too tight. Consider `space-y-5` or `space-y-6` (20-24px) to give each filter row more breathing room.

---

## 6. SPACING & RHYTHM — The Visual Cadence

### Principle: The 4px Grid System

**HTB does:** All spacing is multiples of 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120. No random values. Padding, margins, gaps, border-radius — everything follows this grid.

**Why it works:** A consistent spacing grid creates visual harmony without the user noticing. When spacing is inconsistent (e.g., 7px here, 13px there), the page feels "off" even if the user can't articulate why.

**XpertClass lesson:** Audit your spacing values. Your `gap-6` (24px), `p-5` (20px), `p-8` (32px) follow the grid. But check: are you using `gap-10` (40px) and `gap-16` (64px) consistently? Standardize on: `gap-2` (8px) for tight groups, `gap-4` (16px) for card grids, `gap-6` (24px) for section-level spacing, `gap-8` (32px) for major divisions.

### Principle: Consistent Vertical Rhythm

**HTB does:** Each page section follows the same vertical rhythm: Section padding (80-120px) → Headline + Subtitle (24-32px below headline) → Content grid → Bottom padding. This rhythm is identical across every section of the landing page.

**Why it works:** Consistent rhythm creates predictability. The user learns the pattern and can scan faster because they know where to look next. If one section has 40px padding and another has 120px, the page feels disjointed.

**XpertClass lesson:** Your sections all use `py-28` (consistent). But your internal section spacing varies: some sections have `mb-12` after the subtitle, others have `mb-16`. Standardize to `mb-12` for section headers and `gap-6` for content grids.

### Principle: Density Gradients

**HTB does:** Landing pages are LOW density (big headlines, lots of whitespace, minimal text). Dashboard pages are MEDIUM density (stats, lists, cards). Detail pages are HIGH density (tabs, tables, multiple data points per row).

**Why it works:** The user's intent changes across the journey. On the landing page, they're browsing — low density helps them absorb the value proposition. On the dashboard, they're orienting — medium density gives them enough info to decide. On a detail page, they're working — high density provides the data they need.

**XpertClass lesson:** Your landing page density is correct (low). Your dashboard should be medium density — show a compact stat row, a "continue learning" card, and a course list. Your course detail page should be high density — show section-by-section lesson lists with progress indicators. Don't make the dashboard as sparse as the landing page, and don't make the landing page as dense as the dashboard.

---

## 7. CONSISTENCY PATTERNS — Same Component, Same Look

### Principle: The Universal Badge System

**HTB does:** Every badge across the entire platform uses the same pattern: `rounded-full`, `text-[10-12px]`, `font-semibold`, colored background + colored text. Difficulty badges are always colored dots. Status badges are always pill-shaped. No exceptions.

**Why it works:** Consistency means the user learns the visual language once. Every time they see a colored dot, they know it's difficulty. Every time they see a pill badge, they know it's status. No re-learning required.

**XpertClass lesson:** Your badges are mostly consistent. But check: do your level badges (`page.tsx:143-147`) use the same border-radius as your category badges (`courses/page.tsx:308-312`)? Standardize all badges to `rounded-full`. Standardize all badge text to `text-[10px]` or `text-xs` (pick one). Standardize all badge padding to `px-2.5 py-1`.

### Principle: The Universal Card Pattern

**HTB does:** Every card in the platform follows: Image/visual area (top) → Title (bold) → Meta info (muted) → Action (button/link at bottom). Cards have the same border-radius, same shadow style, same hover effect. The only thing that changes is the content.

**Why it works:** When every card looks the same, the user can focus on the CONTENT differences rather than parsing different layouts. This reduces cognitive load dramatically.

**XpertClass lesson:** Your course cards, trainer cards, and master class cards all have slightly different structures. Standardize: all cards should have the same border-radius (`rounded-xl` or `rounded-2xl`), same border (`border border-slate-200`), same hover effect (`hover:shadow-md`), and same internal padding. The content can vary, but the skeleton should be identical.

### Principle: The Universal Navigation Pattern

**HTB does:** Every section of the platform uses the same navigation pattern: Sidebar (left, collapsed) → Header (top, with search + notifications + user) → Content (center) → Optional right sidebar. The sidebar never changes its layout — only its items.

**Why it works:** The user learns one navigation model and applies it everywhere. They never have to "re-learn" how to navigate when moving from Labs to Academy to Rankings.

**XpertClass lesson:** Your dashboard layout (`layout.tsx`) is consistent — sidebar + main content + bottom nav. But your landing page has a completely different navigation (horizontal nav bar). This is correct — the landing page is a marketing page, not a dashboard. But ensure that once a user logs in, the navigation model is IDENTICAL on every dashboard page. Don't move the sidebar, don't change the header, don't rearrange the layout.

---

## 8. ADDITIONAL PATTERNS — Details That Matter

### Pattern: The LIVE Badge and Timer

**HTB does:** Seasonal events show a pulsing "LIVE" badge (red dot + text) and a countdown timer ("Ends in X days"). Both are in the hero area, impossible to miss.

**Why it works:** Urgency drives action. The LIVE badge says "this is happening NOW." The timer says "you're running out of time." Both create FOMO (fear of missing out) without being pushy. They're informational, not manipulative.

**XpertClass lesson:** For master classes or time-sensitive events, use a LIVE badge (you already have this in `page.tsx:506-509`). Add a countdown timer to upcoming master classes. Place both in the card, not hidden behind a click.

### Pattern: The Social Proof Row

**HTB does:** Rankings page shows the user's OWN rank separately (top-right corner), outside the table. The table shows everyone else's rank.

**Why it works:** The user cares most about THEIR rank. By showing it separately, HTB answers the #1 question immediately ("where am I?") without requiring the user to search through the table. The table then becomes about context ("how do I compare?").

**XpertClass lesson:** On your leaderboard page, show the current user's rank, XP, and level in a prominent card ABOVE the table. Don't make them scroll to find themselves. This pattern applies to any competitive element — always surface the user's personal status first.

### Pattern: The "Don't Know Where to Start?" Prompt

**HTB does:** Academy dashboard shows a "Don't know where to start?" section with a recommended learning path.

**Why it works:** New users face the paradox of choice — too many options, no clear starting point. By providing a recommended path, HTB reduces decision fatigue and increases the chance the user takes action.

**XpertClass lesson:** Your dashboard should have a "Recommended for you" section that shows the next course/lesson the user should take. Base this on their current progress. Don't just list all courses — curate the experience.

---

## SUMMARY: Top 10 Principles XpertClass Should Adopt

| # | Principle | HTB Example | XpertClass Action |
|---|-----------|-------------|-------------------|
| 1 | Show the product in the hero, not just stats | Machine screenshot on landing page | Replace stat grid with a real terminal/lab screenshot |
| 2 | Trust signals between hero and features | Company logos after hero | Add client/student logos or "Built with" badges after hero |
| 3 | Underline tabs, not pill tabs | HTB Labs, Academy | Replace pill tabs with underline tabs in Learning Paths |
| 4 | Table format for data-dense content | Challenges, Rankings tables | Use tables for labs/challenges listings, not cards |
| 5 | XP reward on the completion button | "+10 XP" on "Mark Complete" | Show XP on the "Complete & Continue" button in lessons |
| 6 | Right sidebar for supplementary data | Level/XP/Streak in Academy | Add a right sidebar to dashboard with user stats |
| 7 | Universal badge system | Same badge style everywhere | Standardize all badges: rounded-full, 10px text, consistent padding |
| 8 | Reserve accent color for interactive elements | Green = clickable/active only | Stop using #229C62 for decorative backgrounds |
| 9 | Surface user's personal status first | Own rank shown above rankings table | Show user's rank/XP/level prominently on leaderboard |
| 10 | "Don't know where to start?" prompt | Recommended path on Academy dashboard | Add "Recommended next" section to dashboard |
