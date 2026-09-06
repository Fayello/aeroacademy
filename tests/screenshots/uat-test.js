const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://xpertclass.academy';
const DIR = path.join(__dirname, 'uat-output');
const ADMIN_CREDS = { email: 'admin@test.com', password: 'Test1234!' };

const PAIN_POINTS = [];

function log(msg) { console.log(`  ${msg}`); }
function pain(severity, area, description, fix) {
  PAIN_POINTS.push({ severity, area, description, fix });
  console.log(`  [PAIN-${severity.toUpperCase()}] ${area}: ${description}`);
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ss(page, name) {
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true });
  log(`📸 ${name}.png`);
}
async function goto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }); } catch {}
  await sleep(2000);
}
async function checkVisible(page, selector, name) {
  const el = await page.$(selector);
  if (!el) { pain('MEDIUM', name, `Element not found: ${selector}`, 'Verify element exists'); return false; }
  const visible = await el.isIntersectingViewport();
  if (!visible) { pain('LOW', name, `Element exists but not visible: ${selector}`, 'Check CSS/overflow'); }
  return true;
}

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ============================================================
    // PERSONA 1: Complete Beginner (first visit, no account)
    // ============================================================
    console.log('\n========== PERSONA 1: Complete Beginner ==========');
    console.log('Profile: Non-technical, curious about tech careers, first time visiting');

    // First impression
    await goto(page, '');
    await ss(page, 'P1-01-homepage-first-look');

    // Can they find what the platform is about?
    const heroText = await page.$eval('h1', el => el.textContent).catch(() => '');
    log(`Hero headline: "${heroText}"`);
    if (!heroText || heroText.length < 10) {
      pain('HIGH', 'Homepage', 'No clear hero headline explaining what the platform is', 'Add clear value proposition headline');
    }

    // Can they find pricing?
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(1000);
    await ss(page, 'P1-02-homepage-footer');

    // Try to find "Get Started" or "Sign Up"
    const ctaButtons = await page.$$('a, button');
    let foundCTA = false;
    for (const btn of ctaButtons) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.match(/get started|sign up|create account|start free/i)) {
        foundCTA = true;
        break;
      }
    }
    if (!foundCTA) {
      pain('HIGH', 'Homepage', 'No clear CTA button for signup/get started', 'Add prominent CTA');
    }

    // Try to navigate to courses
    console.log('\n--- Navigation Test ---');
    const navLinks = await page.$$('nav a, header a');
    const navTexts = [];
    for (const link of navLinks) {
      const text = await link.evaluate(el => el.textContent.trim());
      if (text) navTexts.push(text);
    }
    log(`Nav links found: ${navTexts.join(', ')}`);

    // Can beginner find courses?
    await goto(page, '/courses');
    await ss(page, 'P1-03-courses-catalog');
    const courseCount = await page.$$eval('[class*="card"], [class*="Card"]', els => els.length);
    log(`Course cards found: ${courseCount}`);

    // Can they understand what each course is about?
    const firstCourseDesc = await page.$eval('[class*="card"] p, [class*="Card"] p', el => el.textContent).catch(() => '');
    log(`First course description: "${firstCourseDesc.substring(0, 80)}..."`);
    if (!firstCourseDesc || firstCourseDesc.length < 20) {
      pain('MEDIUM', 'Courses', 'Course descriptions too short or missing', 'Add meaningful course descriptions');
    }

    // Try to find labs
    await goto(page, '/labs');
    await ss(page, 'P1-04-labs-page');
    const labsContent = await page.$eval('body', el => el.textContent);
    if (labsContent.includes('available after sign-in')) {
      log('Labs page requires sign-in (expected for gated content)');
    }

    // Try to search
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    if (searchInput) {
      log('Global search found');
      await searchInput.click();
      await searchInput.type('python');
      await sleep(2000);
      await ss(page, 'P1-05-search-results');
    } else {
      pain('HIGH', 'Search', 'No global search functionality on public pages', 'Add search bar in header');
    }

    // Try to find community/about
    await goto(page, '/community');
    await ss(page, 'P1-06-community');

    // Check terms/privacy
    await goto(page, '/terms');
    await ss(page, 'P1-07-terms');

    // ============================================================
    // PERSONA 2: New User (just registered, needs onboarding)
    // ============================================================
    console.log('\n========== PERSONA 2: New Registered User ==========');
    console.log('Profile: Just signed up, wants to start learning quickly');

    await goto(page, '/login');
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"]');
    if (emailInput && passwordInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(ADMIN_CREDS.email);
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(ADMIN_CREDS.password);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await sleep(4000);
    }

    // Onboarding flow
    await ss(page, 'P2-01-onboarding-welcome');
    
    // Check if onboarding is clear
    const onboardingText = await page.$eval('body', el => el.textContent);
    if (onboardingText.includes('Welcome')) {
      log('Onboarding welcome screen visible');
    }

    // Click Get Started
    const allBtns1 = await page.$$('button, a');
    for (const btn of allBtns1) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.includes('Get Started')) {
        await btn.click();
        await sleep(2000);
        break;
      }
    }
    await ss(page, 'P2-02-onboarding-step1');

    // Check step 1 - career field selection
    const step1Options = await page.$$eval('button, [role="option"], [class*="option"]', els => els.map(el => el.textContent.trim()).filter(t => t.length > 0 && t.length < 50));
    log(`Step 1 options: ${step1Options.slice(0, 10).join(', ')}`);
    if (step1Options.length < 3) {
      pain('HIGH', 'Onboarding', 'Not enough career field options in step 1', 'Add more career path options');
    }

    // Check if Fintech/Blockchain/IoT are present
    const allText = step1Options.join(' ').toLowerCase();
    ['fintech', 'blockchain', 'iot', 'cloud', 'ai', 'security', 'devops'].forEach(field => {
      if (allText.includes(field)) {
        log(`  ✓ Found: ${field}`);
      } else {
        pain('MEDIUM', 'Onboarding', `Missing career field: ${field}`, `Add ${field} option`);
      }
    });

    // Skip onboarding to get to dashboard
    const skipBtn = await page.$('text/Skip for now');
    if (skipBtn) {
      await skipBtn.click();
      await sleep(3000);
    }

    // ============================================================
    // PERSONA 3: Returning Learner (has some progress)
    // ============================================================
    console.log('\n========== PERSONA 3: Returning Learner ==========');
    console.log('Profile: Has done some courses, wants to continue');

    await goto(page, '/dashboard');
    await ss(page, 'P3-01-dashboard-returning');

    // Can they find where they left off?
    const progressElements = await page.$$('[class*="progress"], [class*="Progress"]');
    log(`Progress elements found: ${progressElements.length}`);

    // Is there a "continue learning" or "pick up where you left off"?
    const bodyText = await page.$eval('body', el => el.textContent);
    if (bodyText.includes('Start the Path') || bodyText.includes('Continue')) {
      log('Continue/pick up element found');
    } else {
      pain('HIGH', 'Dashboard', 'No "continue learning" or "pick up where you left off" feature', 'Add resume progress section at top of dashboard');
    }

    // Check guided start
    if (bodyText.includes('Guided Start') || bodyText.includes('guided')) {
      log('Guided start section found');
    }

    // Can they quickly access labs?
    await goto(page, '/dashboard/labs');
    await ss(page, 'P3-02-labs-list');
    
    // Can they search/filter labs?
    const searchOrFilter = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="filter" i], select');
    if (searchOrFilter) {
      log('Lab search/filter found');
      await searchOrFilter.click();
      await searchOrFilter.type('docker');
      await sleep(2000);
      await ss(page, 'P3-03-labs-search');
    } else {
      pain('HIGH', 'Labs', 'No search or filter functionality in labs list', 'Add search bar and category filters');
    }

    // Can they see lab difficulty?
    const labCards = await page.$$('[class*="card"], [class*="Card"]');
    log(`Lab cards found: ${labCards.length}`);

    // Check if labs have difficulty badges
    const diffBadges = await page.$$eval('[class*="badge"], [class*="Badge"], [class*="difficulty"]', els => els.length);
    log(`Difficulty badges found: ${diffBadges}`);

    // ============================================================
    // PERSONA 4: Security-Focused Student
    // ============================================================
    console.log('\n========== PERSONA 4: Security Student ==========');
    console.log('Profile: Wants cybersecurity courses, interested in pen testing');

    await goto(page, '/courses');
    await ss(page, 'P4-01-courses-browse');

    // Can they find security-specific courses?
    const courseTexts = await page.$$eval('h2, h3, [class*="title"]', els => els.map(el => el.textContent.trim()));
    const securityCourses = courseTexts.filter(t => /security|penetration|forensic|incident|malware|vulnerability/i.test(t));
    log(`Security courses found: ${securityCourses.length}`);
    securityCourses.forEach(c => log(`  - ${c}`));

    // Can they filter by category?
    const categoryFilters = await page.$$('[class*="filter"], [class*="Filter"], [class*="category"], select, [role="tablist"]');
    log(`Category filters: ${categoryFilters.length}`);
    if (categoryFilters.length === 0) {
      pain('HIGH', 'Courses', 'No category filter on courses page', 'Add filter tabs (Security, DevOps, Cloud, etc.)');
    }

    // Check if course detail shows curriculum
    if (securityCourses.length > 0) {
      // Find first security course link
      const links = await page.$$('a[href*="/courses/"]');
      for (const link of links) {
        const text = await link.evaluate(el => el.textContent.trim());
        if (/security|penetration|forensic/i.test(text)) {
          await link.click();
          await sleep(3000);
          break;
        }
      }
      await ss(page, 'P4-02-course-detail-security');
      
      // Does it show lessons/modules?
      const modules = await page.$$('[class*="module"], [class*="Module"], [class*="curriculum"], [class*="lesson"]');
      log(`Modules/lessons visible: ${modules.length}`);
    }

    // ============================================================
    // PERSONA 5: DevOps/Cloud Engineer
    // ============================================================
    console.log('\n========== PERSONA 5: DevOps Engineer ==========');
    console.log('Profile: Experienced DevOps, wants hands-on labs');

    await goto(page, '/dashboard/labs');
    await sleep(3000);
    await ss(page, 'P5-01-labs-dashboard');

    // Can they find DevOps labs?
    const labTitles = await page.$$eval('h3, h4, [class*="title"]', els => els.map(el => el.textContent.trim()).filter(t => t.length > 5));
    const devopsLabs = labTitles.filter(t => /docker|kubernetes|k8s|terraform|ansible|ci\/cd|jenkins|gitlab|aws|azure|gcp/i.test(t));
    log(`DevOps labs found: ${devopsLabs.length}`);
    devopsLabs.slice(0, 5).forEach(l => log(`  - ${l}`));

    // Can they filter by difficulty?
    const difficultyFilter = await page.$('[class*="difficulty"], select, [data-filter]');
    if (!difficultyFilter) {
      pain('MEDIUM', 'Labs', 'No difficulty filter in labs', 'Add difficulty filter (Beginner/Intermediate/Advanced)');
    }

    // Can they see flag counts?
    const flagInfo = await page.$$eval('[class*="flag"], [class*="Flag"]', els => els.length);
    log(`Flag count elements: ${flagInfo}`);

    // Check lab detail page
    const firstLabLink = await page.$('a[href*="/dashboard/labs/"]');
    if (firstLabLink) {
      await firstLabLink.click();
      await sleep(4000);
      await ss(page, 'P5-02-lab-workspace');
      
      // Check if objectives are visible
      const objectives = await page.$$('[class*="objective"], [class*="Objective"], [class*="task"]');
      log(`Lab objectives visible: ${objectives.length}`);
    }

    // ============================================================
    // PERSONA 6: Career Switcher (non-technical)
    // ============================================================
    console.log('\n========== PERSONA 6: Career Switcher ==========');
    console.log('Profile: Business background, wants to transition to tech');

    await goto(page, '/dashboard/starting-point');
    await ss(page, 'P6-01-starting-point');

    // Is there a clear starting path?
    const spText = await page.$eval('body', el => el.textContent);
    if (spText.includes('Starting Point') || spText.includes('starting point')) {
      log('Starting Point page found');
    }

    // Are beginner labs clearly marked?
    const beginnerLabs = await page.$$eval('[class*="beginner"], [class*="Beginner"], [class*="difficulty"]', els => els.map(el => el.textContent.trim()));
    log(`Beginner indicators: ${beginnerLabs.length}`);

    // Is there guidance on what to learn first?
    if (spText.includes('recommended') || spText.includes('suggested') || spText.includes('first')) {
      log('Recommendations found');
    } else {
      pain('HIGH', 'Starting Point', 'No clear "what to learn first" guidance for beginners', 'Add recommended first steps');
    }

    // Check certifications page
    await goto(page, '/dashboard/certifications');
    await ss(page, 'P6-02-certifications');
    const certText = await page.$eval('body', el => el.textContent);
    if (certText.includes('XCA') || certText.includes('XCP') || certText.includes('XCE')) {
      log('Certification tiers visible');
    }

    // ============================================================
    // PERSONA 7: Enterprise/Team Admin
    // ============================================================
    console.log('\n========== PERSONA 7: Team Admin ==========');
    console.log('Profile: Wants to manage a team, track progress');

    await goto(page, '/dashboard/teams');
    await ss(page, 'P7-01-teams');

    // Can they create a team?
    const allBtns7 = await page.$$('button, a');
    let found7 = false;
    for (const btn of allBtns7) {
      const text = await btn.evaluate(el => el.textContent.trim());
      if (text.match(/create|new team|add member/i)) { found7 = true; break; }
    }
    if (!found7) {
      pain('MEDIUM', 'Teams', 'No obvious "Create Team" button', 'Add prominent create team button');
    }

    // Check guilds
    await goto(page, '/dashboard/guilds');
    await ss(page, 'P7-02-guilds');

    // Check admin dashboard
    await goto(page, '/dashboard/admin');
    await ss(page, 'P7-03-admin-dashboard');
    const adminText = await page.$eval('body', el => el.textContent);
    if (adminText.includes('Admin') || adminText.includes('admin')) {
      log('Admin dashboard accessible');
    }

    // Check leaderboard
    await goto(page, '/dashboard/leaderboard');
    await ss(page, 'P7-04-leaderboard');

    // ============================================================
    // PERSONA 8: Mobile User
    // ============================================================
    console.log('\n========== PERSONA 8: Mobile User ==========');
    console.log('Profile: Using phone, wants to browse courses');

    await page.setViewport({ width: 375, height: 812 }); // iPhone viewport
    await goto(page, '');
    await ss(page, 'P8-01-homepage-mobile');

    // Is there a hamburger menu?
    const hamburger = await page.$('[class*="hamburger"], [class*="menu-toggle"], [aria-label*="menu" i], [class*="MenuButton"]');
    if (hamburger) {
      log('Mobile menu toggle found');
      try { await hamburger.click(); } catch { await page.evaluate(el => el.click(), hamburger); }
      await sleep(1000);
      await ss(page, 'P8-02-mobile-menu-open');
    } else {
      pain('HIGH', 'Mobile', 'No hamburger/mobile menu toggle', 'Add responsive mobile navigation');
    }

    // Check courses on mobile
    await goto(page, '/courses');
    await ss(page, 'P8-03-courses-mobile');

    // Is the layout responsive?
    const overflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    if (overflow) {
      pain('HIGH', 'Mobile', 'Horizontal overflow on mobile — content extends beyond viewport', 'Fix responsive layout');
    }

    // Check login on mobile
    await goto(page, '/login');
    await ss(page, 'P8-04-login-mobile');

    // Check dashboard on mobile
    const emailM = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passM = await page.$('input[type="password"]');
    if (emailM && passM) {
      await emailM.click({ clickCount: 3 });
      await emailM.type(ADMIN_CREDS.email);
      await passM.click({ clickCount: 3 });
      await passM.type(ADMIN_CREDS.password);
      const btn = await page.$('button[type="submit"]');
      if (btn) { try { await btn.click(); } catch {} }
      await sleep(4000);
      try {
        const skipM = await page.$('text/Skip for now');
        if (skipM) { try { await skipM.click(); } catch {} await sleep(3000); }
      } catch {}
    }
    await goto(page, '/dashboard');
    await ss(page, 'P8-05-dashboard-mobile');

    // Check sidebar on mobile
    const sidebar = await page.$('[class*="sidebar"], [class*="Sidebar"], nav');
    if (sidebar) {
      const sidebarVisible = await sidebar.isIntersectingViewport();
      if (sidebarVisible) {
        pain('MEDIUM', 'Mobile', 'Sidebar visible on mobile — should be hidden/collapsible', 'Hide sidebar behind hamburger on mobile');
      }
    }

    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // ============================================================
    // PERSONA 9: Accessibility-Focused User
    // ============================================================
    console.log('\n========== PERSONA 9: Accessibility User ==========');
    console.log('Profile: Uses screen reader, keyboard navigation');

    await goto(page, '');
    await ss(page, 'P9-01-homepage-a11y');

    // Check for alt text on images
    const images = await page.$$eval('img', imgs => imgs.map(img => ({ src: img.src, alt: img.alt })));
    const imgsWithoutAlt = images.filter(i => !i.alt || i.alt.length === 0);
    log(`Images: ${images.length} total, ${imgsWithoutAlt.length} without alt text`);
    if (imgsWithoutAlt.length > 0) {
      pain('MEDIUM', 'Accessibility', `${imgsWithoutAlt.length} images missing alt text`, 'Add descriptive alt text to all images');
    }

    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await ss(page, 'P9-02-keyboard-focus');

    // Check for focus indicators
    const focusedEl = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      return { tag: el.tagName, text: el.textContent?.substring(0, 50) };
    });
    log(`Focused element: ${JSON.stringify(focusedEl)}`);

    // Check heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => els.map(el => ({ level: el.tagName, text: el.textContent.trim().substring(0, 50) })));
    log(`Heading structure: ${headings.map(h => `${h.level}: ${h.text}`).join(' > ')}`);

    // Check for ARIA labels
    const ariaLabels = await page.$$eval('[aria-label], [aria-labelledby], [role]', els => els.length);
    log(`ARIA-labeled elements: ${ariaLabels}`);

    // Check color contrast (basic check)
    const lowContrast = await page.evaluate(() => {
      const els = document.querySelectorAll('p, span, a, h1, h2, h3');
      let issues = 0;
      els.forEach(el => {
        const style = getComputedStyle(el);
        const color = style.color;
        // Basic check: if color is very light on light bg or very dark on dark bg
        if (color.includes('128, 128, 128') || color.includes('169, 169, 169')) {
          issues++;
        }
      });
      return issues;
    });
    if (lowContrast > 0) {
      pain('MEDIUM', 'Accessibility', `${lowContrast} elements may have low contrast`, 'Review color contrast ratios');
    }

    // Check forms have labels
    const inputs = await page.$$eval('input', els => els.map(el => ({
      type: el.type,
      name: el.name,
      id: el.id,
      placeholder: el.placeholder,
      hasLabel: !!el.labels?.length
    })));
    const inputsWithoutLabels = inputs.filter(i => !i.hasLabel && !i.placeholder);
    log(`Form inputs: ${inputs.length} total, ${inputsWithoutLabels.length} without labels/placeholders`);
    if (inputsWithoutLabels.length > 0) {
      pain('MEDIUM', 'Accessibility', `${inputsWithoutLabels.length} form inputs missing labels`, 'Add <label> elements');
    }

    // ============================================================
    // PERSONA 10: Power User / Advanced Learner
    // ============================================================
    console.log('\n========== PERSONA 10: Power User ==========');
    console.log('Profile: Experienced, wants efficiency, keyboard shortcuts');

    // Check search functionality
    await goto(page, '/dashboard');
    await sleep(2000);

    // Is there a global search?
    const globalSearch = await page.$('input[placeholder*="search" i], input[type="search"]');
    if (globalSearch) {
      log('Global search found in dashboard');
      await globalSearch.click();
      await globalSearch.type('kubernetes');
      await sleep(2000);
      await ss(page, 'P10-01-search-kubernetes');

      // Check search results
      const results = await page.$$('[class*="result"], [class*="Result"], [class*="suggestion"]');
      log(`Search results: ${results.length}`);
      if (results.length === 0) {
        pain('HIGH', 'Search', 'Search returns no results or results not visible', 'Fix search indexing and results display');
      }
    } else {
      pain('HIGH', 'Search', 'No global search in dashboard', 'Add Cmd+K or Ctrl+K search');
    }

    // Check settings page
    await goto(page, '/dashboard/settings');
    await ss(page, 'P10-02-settings');

    // Check profile page
    await goto(page, '/dashboard/profile');
    await ss(page, 'P10-03-profile');

    // Check notifications
    await goto(page, '/dashboard/notifications');
    await ss(page, 'P10-04-notifications');

    // Check streak page
    await goto(page, '/dashboard/streak');
    await ss(page, 'P10-05-streak');

    // Check battle pass
    await goto(page, '/dashboard/battle-pass');
    await ss(page, 'P10-06-battle-pass');

    // Check analytics
    await goto(page, '/dashboard/analytics');
    await ss(page, 'P10-07-analytics');

    // Check competency
    await goto(page, '/dashboard/competency');
    await ss(page, 'P10-08-competency');

    // Check skill gaps
    await goto(page, '/dashboard/skill-gaps');
    await ss(page, 'P10-09-skill-gaps');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n\n========================================');
    console.log('UAT COMPLETE');
    console.log(`Screenshots saved to: ${DIR}`);
    console.log(`Total pain points found: ${PAIN_POINTS.length}`);
    console.log('========================================\n');

    // Write pain points report
    const report = PAIN_POINTS.map((p, i) =>
      `${i + 1}. [${p.severity.toUpperCase()}] ${p.area}\n   Issue: ${p.description}\n   Fix: ${p.fix}`
    ).join('\n\n');

    fs.writeFileSync(path.join(DIR, 'PAIN-POINTS.txt'), report);
    console.log('Pain points written to PAIN-POINTS.txt');
    console.log('\n' + report);

  } catch (err) {
    console.error('FATAL ERROR:', err.message);
    await ss(page, 'error-state');
  } finally {
    await browser.close();
  }
})();
