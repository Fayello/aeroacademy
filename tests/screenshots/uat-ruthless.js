const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'https://xpertclass.academy';
const DIR = path.join(__dirname, 'uat-ruthless');
const CREDS = { email: 'admin@test.com', password: 'Test1234!' };
const PAIN = [];
let screenshotNum = 0;

function log(msg) { console.log(`  ${msg}`); }
function pain(sev, area, desc, fix, page_name) {
  PAIN.push({ sev, area, desc, fix, page: page_name });
  console.log(`  [${sev}] ${area}: ${desc}`);
}
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function ss(page, label) {
  screenshotNum++;
  const name = `${String(screenshotNum).padStart(2,'0')}-${label}`;
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true });
  log(`${name}.png`);
  return name;
}
async function goto(page, route) {
  const url = route.startsWith('http') ? route : `${BASE}${route}`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }); } catch {}
  await sleep(1500);
}
async function isLoggedIn(page) {
  return await page.$('input[type="email"]') === null;
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

  // Track console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  // Track failed requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });

  try {
    // ================================================================
    // PHASE 1: EVERY PUBLIC PAGE — BROKEN LINKS, MISSING CONTENT, 404s
    // ================================================================
    console.log('\n===== PHASE 1: ALL PUBLIC PAGES =====');
    const publicRoutes = [
      ['/', 'homepage'],
      ['/courses', 'courses-catalog'],
      ['/labs', 'labs-public'],
      ['/community', 'community'],
      ['/community/ambassador-program', 'ambassador'],
      ['/community/volunteer-program', 'volunteer'],
      ['/login', 'login'],
      ['/register', 'register'],
      ['/forgot-password', 'forgot-password'],
      ['/terms', 'terms'],
      ['/privacy', 'privacy'],
      ['/get-started', 'get-started'],
    ];

    for (const [route, name] of publicRoutes) {
      console.log(`\nTesting: ${route}`);
      const response = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch(e => null);
      await sleep(1500);
      
      if (!response) {
        pain('CRITICAL', name, `Page failed to load: ${route}`, 'Fix server error', name);
        continue;
      }
      
      const status = response.status();
      const title = await page.title();
      log(`Status: ${status}, Title: "${title}"`);
      
      if (status === 404) {
        pain('CRITICAL', name, `404 Not Found: ${route}`, 'Fix routing or redirect', name);
        continue;
      }
      if (status >= 500) {
        pain('CRITICAL', name, `Server error ${status}: ${route}`, 'Fix server error', name);
        continue;
      }
      
      // Check for blank/empty pages
      const bodyText = await page.$eval('body', el => el.textContent.trim());
      if (bodyText.length < 50) {
        pain('HIGH', name, `Page has very little content (${bodyText.length} chars)`, 'Add content', name);
      }
      
      // Check for broken images
      const brokenImages = await page.$$eval('img', imgs => 
        imgs.filter(img => !img.complete || img.naturalWidth === 0).map(img => img.src)
      );
      if (brokenImages.length > 0) {
        pain('HIGH', name, `Broken images: ${brokenImages.join(', ')}`, 'Fix image paths', name);
      }
      
      // Check for console errors
      if (consoleErrors.length > 0) {
        const newErrors = [...consoleErrors];
        consoleErrors.length = 0;
        pain('MEDIUM', name, `Console errors: ${newErrors.slice(0, 3).join('; ')}`, 'Fix JS errors', name);
      }
      
      await ss(page, name);
    }

    // ================================================================
    // PHASE 2: LOGIN FLOW — EVERY POSSIBLE FAILURE
    // ================================================================
    console.log('\n===== PHASE 2: LOGIN FLOW =====');
    
    // Test 2a: Empty form submission
    console.log('\n2a: Empty login');
    await goto(page, '/login');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await sleep(2000);
      const errorMsg = await page.$('[class*="error"], [class*="Error"], [role="alert"]');
      if (!errorMsg) {
        pain('HIGH', 'Login', 'No error shown for empty form submission', 'Show validation error', 'login');
      }
      await ss(page, 'login-empty-submit');
    }

    // Test 2b: Wrong password
    console.log('2b: Wrong password');
    await goto(page, '/login');
    const ei = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const pi = await page.$('input[type="password"]');
    if (ei && pi) {
      await ei.type('admin@test.com');
      await pi.type('WrongPassword123!');
      const sb = await page.$('button[type="submit"]');
      if (sb) await sb.click();
      await sleep(2000);
      const errText = await page.$eval('body', el => el.textContent);
      if (!errText.includes('Invalid') && !errText.includes('incorrect') && !errText.includes('wrong') && !errText.includes('error')) {
        pain('HIGH', 'Login', 'No error message shown for wrong password', 'Show clear error message', 'login');
      }
      await ss(page, 'login-wrong-password');
    }

    // Test 2c: Successful login
    console.log('2c: Successful login');
    await goto(page, '/login');
    const ei2 = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const pi2 = await page.$('input[type="password"]');
    if (ei2 && pi2) {
      await ei2.click({ clickCount: 3 }); await ei2.type(CREDS.email);
      await pi2.click({ clickCount: 3 }); await pi2.type(CREDS.password);
      const sb2 = await page.$('button[type="submit"]');
      if (sb2) await sb2.click();
      await sleep(4000);
      const afterLoginUrl = page.url();
      log(`After login URL: ${afterLoginUrl}`);
      if (afterLoginUrl.includes('/login')) {
        pain('CRITICAL', 'Login', 'Login appears to succeed but URL still /login', 'Fix redirect after login', 'login');
      }
      // Skip onboarding — set localStorage flag as backup
      await page.evaluate(() => {
        localStorage.setItem('onboardingComplete', 'true');
      });
      try {
        const skipBtns = await page.$$('button, a');
        for (const btn of skipBtns) {
          const text = await btn.evaluate(el => el.textContent.trim());
          if (text.includes('Skip for now')) { await btn.click(); await sleep(3000); break; }
        }
      } catch {}
      // Navigate to dashboard after skip
      await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle2' });
      await sleep(2000);
    }

    // ================================================================
    // PHASE 3: EVERY DASHBOARD PAGE — CHECK FOR ERRORS, EMPTY STATES, BROKEN UI
    // ================================================================
    console.log('\n===== PHASE 3: ALL DASHBOARD PAGES =====');
    const dashRoutes = [
      '/dashboard', '/dashboard/courses', '/dashboard/labs', '/dashboard/starting-point',
      '/dashboard/certifications', '/dashboard/leaderboard', '/dashboard/teams',
      '/dashboard/guilds', '/dashboard/challenges', '/dashboard/badges',
      '/dashboard/achievements', '/dashboard/streak', '/dashboard/battle-pass',
      '/dashboard/assessments', '/dashboard/profile', '/dashboard/settings',
      '/dashboard/notifications', '/dashboard/community', '/dashboard/training',
      '/dashboard/analytics', '/dashboard/competency', '/dashboard/skill-gaps',
      '/dashboard/referrals', '/dashboard/events', '/dashboard/exams',
      '/dashboard/academics', '/dashboard/curricula', '/dashboard/gradebook',
      '/dashboard/readiness-transcript', '/dashboard/recommendations',
      '/dashboard/boss-missions', '/dashboard/compete', '/dashboard/seasons',
      '/dashboard/ranking', '/dashboard/university-ranking',
      '/dashboard/capability-ranking', '/dashboard/enterprise',
      '/dashboard/registry', '/dashboard/genome', '/dashboard/my-missions',
      '/dashboard/admin', '/dashboard/admin/security', '/dashboard/admin/audit',
    ];

    for (const route of dashRoutes) {
      const pageName = route.split('/').pop() || 'dashboard';
      console.log(`\nTesting: ${route}`);
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
      await sleep(1500);
      
      const url = page.url();
      const status = await page.evaluate(() => document.title);
      
      // Check if redirected to login (auth issue)
      if (url.includes('/login')) {
        pain('CRITICAL', pageName, `Auth redirect: ${route} → /login`, 'Fix auth/session', pageName);
        continue;
      }
      
      // Check if redirected to onboarding
      if (url.includes('/onboarding')) {
        log(`Redirected to onboarding (expected for some)`);
      }
      
      // Check body content
      const bodyText = await page.$eval('body', el => el.textContent.trim());
      if (bodyText.length < 30) {
        pain('HIGH', pageName, `Empty page content at ${route}`, 'Fix page rendering', pageName);
      }
      
      // Check for "Something went wrong" or error boundaries
      if (bodyText.includes('Something went wrong') || bodyText.includes('Internal Server Error') || bodyText.includes('Application error')) {
        pain('CRITICAL', pageName, `Error boundary hit at ${route}`, 'Fix runtime error', pageName);
        continue;
      }
      
      // Check for "404" text
      if (bodyText.includes('404') && bodyText.length < 200) {
        pain('HIGH', pageName, `404 page at ${route}`, 'Fix routing', pageName);
        continue;
      }
      
      // Check if page has meaningful content (not just sidebar)
      const mainContent = await page.$('main, [class*="content"], [class*="Content"], [class*="main"]');
      if (!mainContent) {
        pain('MEDIUM', pageName, `No main content container at ${route}`, 'Add semantic HTML', pageName);
      }
      
      // Check broken links on this page
      const links = await page.$$eval('a[href]', els => els.map(el => ({ href: el.href, text: el.textContent.trim().substring(0, 30) })));
      const brokenLinks = links.filter(l => l.href.includes('undefined') || l.href.includes('null') || l.href.includes('[object'));
      if (brokenLinks.length > 0) {
        pain('HIGH', pageName, `Broken links: ${brokenLinks.map(l => `${l.text}→${l.href}`).join(', ')}`, 'Fix link hrefs', pageName);
      }
      
      await ss(page, `dash-${pageName}`);
    }

    // ================================================================
    // PHASE 4: NAVIGATION — CAN USERS FIND ANYTHING?
    // ================================================================
    console.log('\n===== PHASE 4: NAVIGATION DEPTH =====');
    
    // Test sidebar navigation
    await goto(page, '/dashboard');
    await sleep(2000);
    
    const sidebarLinks = await page.$$eval('nav a, [class*="sidebar"] a, [class*="Sidebar"] a', els => 
      els.map(el => ({ text: el.textContent.trim(), href: el.href }))
    );
    log(`Sidebar links found: ${sidebarLinks.length}`);
    
    // Click every sidebar link and check if it works
    for (const link of sidebarLinks.slice(0, 15)) {
      if (!link.href || link.href === '#' || link.href.includes('javascript:')) {
        pain('HIGH', 'Navigation', `Dead link in sidebar: "${link.text}" → ${link.href}`, 'Fix link href', 'navigation');
        continue;
      }
      
      try {
        await page.goto(link.href, { waitUntil: 'networkidle2', timeout: 15000 });
        await sleep(1000);
        
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          pain('HIGH', 'Navigation', `Sidebar link "${link.text}" redirects to login`, 'Fix auth', 'navigation');
        }
        
        const bodyText = await page.$eval('body', el => el.textContent.trim());
        if (bodyText.includes('Something went wrong') || bodyText.includes('Application error')) {
          pain('HIGH', 'Navigation', `Sidebar link "${link.text}" leads to error page`, 'Fix page', 'navigation');
        }
      } catch (e) {
        pain('MEDIUM', 'Navigation', `Sidebar link "${link.text}" failed to load: ${e.message}`, 'Fix navigation', 'navigation');
      }
    }
    
    // Test breadcrumb navigation
    console.log('\n--- Breadcrumb Test ---');
    await goto(page, '/dashboard/labs');
    await sleep(2000);
    const breadcrumbs = await page.$$('[class*="breadcrumb"], [class*="Breadcrumb"], nav[aria-label="breadcrumb"]');
    log(`Breadcrumb elements: ${breadcrumbs.length}`);
    if (breadcrumbs.length === 0) {
      pain('MEDIUM', 'Navigation', 'No breadcrumb navigation on dashboard pages', 'Add breadcrumbs for nested pages', 'navigation');
    }

    // ================================================================
    // PHASE 5: SEARCH — DOES IT ACTUALLY WORK?
    // ================================================================
    console.log('\n===== PHASE 5: SEARCH FUNCTIONALITY =====');
    
    await goto(page, '/dashboard');
    await sleep(2000);
    
    // Find search input
    const searchInputs = await page.$$('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    log(`Search inputs found: ${searchInputs.length}`);
    
    if (searchInputs.length === 0) {
      pain('CRITICAL', 'Search', 'NO global search found anywhere in dashboard', 'Add Cmd+K / Ctrl+K search', 'search');
    } else {
      const searchInput = searchInputs[0];
      await searchInput.click();
      
      // Test empty search
      await searchInput.type('a');
      await sleep(2000);
      await ss(page, 'search-typing');
      
      // Test search for non-existent term
      await searchInput.click({ clickCount: 3 });
      await searchInput.type('xyznonexistent123');
      await sleep(2000);
      const searchResults = await page.$$('[class*="result"], [class*="Result"], [class*="suggestion"]');
      log(`Search results for nonsense: ${searchResults.length}`);
      await ss(page, 'search-nonsense');
      
      // Test search for real content
      await searchInput.click({ clickCount: 3 });
      await searchInput.type('kubernetes');
      await sleep(3000);
      const realResults = await page.$$('[class*="result"], [class*="Result"], [class*="suggestion"]');
      log(`Search results for "kubernetes": ${realResults.length}`);
      if (realResults.length === 0) {
        pain('HIGH', 'Search', 'Search returns no results for "kubernetes" (known content)', 'Fix search indexing', 'search');
      }
      await ss(page, 'search-kubernetes');
      
      // Test search for "docker"
      await searchInput.click({ clickCount: 3 });
      await searchInput.type('docker');
      await sleep(3000);
      await ss(page, 'search-docker');
    }

    // ================================================================
    // PHASE 6: COURSE DETAIL — DEEP DIVE
    // ================================================================
    console.log('\n===== PHASE 6: COURSE DETAIL PAGES =====');
    await goto(page, '/courses');
    await sleep(2000);
    
    const courseLinks = await page.$$('a[href*="/courses/"]');
    log(`Course links found: ${courseLinks.length}`);
    
    for (let i = 0; i < Math.min(5, courseLinks.length); i++) {
      try {
        await courseLinks[i].click();
        await sleep(3000);
        const url = page.url();
        const courseName = await page.$eval('h1, h2', el => el.textContent.trim()).catch(() => 'unknown');
        log(`Course ${i+1}: ${courseName} (${url})`);
        
        // Check for curriculum
        const modules = await page.$$('[class*="module"], [class*="Module"], [class*="lesson"], [class*="Lesson"], details, summary');
        log(`  Modules visible: ${modules.length}`);
        
        // Check for "Start Learning" or CTA
        const bodyText = await page.$eval('body', el => el.textContent);
        const hasCTA = bodyText.includes('Start') || bodyText.includes('Enroll') || bodyText.includes('Begin');
        log(`  Has CTA: ${hasCTA}`);
        
        // Check for lesson count
        const lessonCount = bodyText.match(/(\d+)\s*lessons?/i);
        if (lessonCount) log(`  Lesson count: ${lessonCount[1]}`);
        
        await ss(page, `course-detail-${i+1}`);
        
        // Go back
        await page.goBack();
        await sleep(1500);
      } catch (e) {
        log(`  Error: ${e.message}`);
      }
    }

    // ================================================================
    // PHASE 7: LAB WORKSPACE — START, INTERACT, STOP
    // ================================================================
    console.log('\n===== PHASE 7: LAB WORKSPACE =====');
    await goto(page, '/dashboard/labs');
    await sleep(3000);
    
    // Find lab links
    const labLinks = await page.$$('a[href*="/dashboard/labs/"]');
    log(`Lab links found: ${labLinks.length}`);
    
    if (labLinks.length > 0) {
      try {
        await labLinks[0].click();
        await sleep(4000);
        const labName = await page.$eval('h1, h2', el => el.textContent.trim()).catch(() => 'unknown');
        log(`Lab: ${labName}`);
        
        // Check for Start Machine button
        const startBtn = await page.$('button, a');
        let foundStart = false;
        const allBtns = await page.$$('button, a');
        for (const btn of allBtns) {
          const text = await btn.evaluate(el => el.textContent.trim());
          if (text.includes('Start') || text.includes('Launch')) {
            foundStart = true;
            log(`Start button found: "${text}"`);
            break;
          }
        }
        if (!foundStart) {
          pain('HIGH', 'Lab', 'No Start Machine/Launch button found', 'Add start button', 'lab-workspace');
        }
        
        // Check for objectives
        const bodyText = await page.$eval('body', el => el.textContent);
        if (bodyText.includes('Objective') || bodyText.includes('objective')) {
          log('Objectives section found');
        } else {
          pain('MEDIUM', 'Lab', 'No objectives visible on lab page', 'Show lab objectives', 'lab-workspace');
        }
        
        // Check for flag submission
        if (bodyText.includes('flag') || bodyText.includes('Flag') || bodyText.includes('submit')) {
          log('Flag submission area found');
        }
        
        // Check for lab info tabs
        const tabs = await page.$$('[role="tab"], [class*="tab"], [class*="Tab"]');
        log(`Tabs found: ${tabs.length}`);
        
        await ss(page, 'lab-workspace-detail');
        
        // Try to start machine
        for (const btn of await page.$$('button, a')) {
          const text = await btn.evaluate(el => el.textContent.trim());
          if (text.includes('Start Machine')) {
            try { await btn.click(); } catch { await page.evaluate(el => el.click(), btn); }
            await sleep(8000);
            break;
          }
        }
        await ss(page, 'lab-workspace-started');
        
        // Check for terminal
        const terminal = await page.$('[class*="terminal"], [class*="Terminal"], [class*="xterm"]');
        if (terminal) {
          log('Terminal element found');
        } else {
          log('Terminal not yet visible (may be loading)');
        }
        
      } catch (e) {
        log(`Error: ${e.message}`);
      }
    }

    // ================================================================
    // PHASE 8: FORM VALIDATION — EVERY INPUT
    // ================================================================
    console.log('\n===== PHASE 8: FORM VALIDATION =====');
    
    // Register page
    await goto(page, '/register');
    await sleep(2000);
    
    // Test empty submission
    const regSubmit = await page.$('button[type="submit"]');
    if (regSubmit) {
      try { await regSubmit.click(); } catch { await page.evaluate(el => el.click(), regSubmit); }
      await sleep(2000);
      const errors = await page.$$('[class*="error"], [class*="Error"], [role="alert"], [class*="invalid"]');
      log(`Register validation errors shown: ${errors.length}`);
      if (errors.length === 0) {
        pain('HIGH', 'Register', 'No validation errors for empty form', 'Add client-side validation', 'register');
      }
      await ss(page, 'register-validation');
    }
    
    // Test weak password
    await goto(page, '/register');
    await sleep(1500);
    const nameInput = await page.$('input[name*="name" i], input[placeholder*="name" i]');
    const emailReg = await page.$('input[type="email"], input[name="email"]');
    const passReg = await page.$('input[type="password"]');
    if (nameInput && emailReg && passReg) {
      await nameInput.type('Test User');
      await emailReg.type('test@invalid');
      await passReg.type('123');
      const regBtn = await page.$('button[type="submit"]');
      if (regBtn) { try { await regBtn.click(); } catch {} }
      await sleep(2000);
      await ss(page, 'register-weak-password');
    }

    // Forgot password page
    await goto(page, '/forgot-password');
    await sleep(1500);
    const fpSubmit = await page.$('button[type="submit"]');
    if (fpSubmit) {
      try { await fpSubmit.click(); } catch {}
      await sleep(2000);
      await ss(page, 'forgot-password-validation');
    }

    // ================================================================
    // PHASE 9: MOBILE RESPONSIVENESS — EVERY KEY PAGE
    // ================================================================
    console.log('\n===== PHASE 9: MOBILE RESPONSIVENESS =====');
    await page.setViewport({ width: 375, height: 812 });
    
    const mobilePages = [
      ['/', 'mobile-homepage'],
      ['/courses', 'mobile-courses'],
      ['/login', 'mobile-login'],
      ['/register', 'mobile-register'],
    ];
    
    for (const [route, name] of mobilePages) {
      await goto(page, route);
      await sleep(1500);
      
      // Check horizontal overflow
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      if (overflow) {
        pain('HIGH', 'Mobile', `Horizontal overflow on ${route}`, 'Fix responsive CSS', name);
      }
      
      // Check if text is readable (not too small)
      const tooSmall = await page.evaluate(() => {
        const els = document.querySelectorAll('p, a, span, h1, h2, h3');
        let count = 0;
        els.forEach(el => {
          const size = parseFloat(getComputedStyle(el).fontSize);
          if (size < 10 && el.textContent.trim().length > 0) count++;
        });
        return count;
      });
      if (tooSmall > 0) {
        pain('MEDIUM', 'Mobile', `${tooSmall} elements with font-size < 10px on ${route}`, 'Increase minimum font size', name);
      }
      
      // Check touch targets
      const smallTargets = await page.evaluate(() => {
        const els = document.querySelectorAll('a, button, input, select');
        let count = 0;
        els.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) count++;
        });
        return count;
      });
      if (smallTargets > 5) {
        pain('MEDIUM', 'Mobile', `${smallTargets} touch targets < 44px on ${route}`, 'Increase tap target size', name);
      }
      
      await ss(page, name);
    }
    
    // Test mobile dashboard
    const emailM = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passM = await page.$('input[type="password"]');
    if (emailM && passM) {
      await emailM.type(CREDS.email);
      await passM.type(CREDS.password);
      const btn = await page.$('button[type="submit"]');
      if (btn) { try { await btn.click(); } catch {} }
      await sleep(4000);
      try {
        const skipBtns = await page.$$('button, a');
        for (const btn of skipBtns) {
          const text = await btn.evaluate(el => el.textContent.trim());
          if (text.includes('Skip for now')) { try { await btn.click(); } catch {} await sleep(3000); break; }
        }
      } catch {}
    }
    
    const mobileDashPages = ['/dashboard', '/dashboard/labs', '/dashboard/courses', '/dashboard/profile'];
    for (const route of mobileDashPages) {
      await goto(page, route);
      await sleep(1500);
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      if (overflow) {
        pain('HIGH', 'Mobile', `Horizontal overflow on ${route}`, 'Fix responsive CSS', `mobile-${route.split('/').pop()}`);
      }
      await ss(page, `mobile-${route.split('/').pop()}`);
    }
    
    await page.setViewport({ width: 1920, height: 1080 });

    // ================================================================
    // PHASE 10: TABLET RESPONSIVENESS
    // ================================================================
    console.log('\n===== PHASE 10: TABLET (768px) =====');
    await page.setViewport({ width: 768, height: 1024 });
    
    for (const route of ['/', '/dashboard', '/courses', '/dashboard/labs']) {
      await goto(page, route);
      await sleep(1500);
      const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      if (overflow) {
        pain('MEDIUM', 'Tablet', `Horizontal overflow on ${route} at 768px`, 'Fix responsive CSS', `tablet-${route}`);
      }
      await ss(page, `tablet-${route.split('/').pop() || 'home'}`);
    }
    await page.setViewport({ width: 1920, height: 1080 });

    // ================================================================
    // PHASE 11: ACCESSIBILITY DEEP DIVE
    // ================================================================
    console.log('\n===== PHASE 11: ACCESSIBILITY =====');
    await goto(page, '');
    await sleep(2000);
    
    // Tab navigation test
    console.log('Testing tab navigation...');
    let tabStops = 0;
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press('Tab');
      await sleep(100);
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tag: el.tagName, text: el.textContent?.substring(0, 30), hasOutline: getComputedStyle(el).outlineStyle !== 'none' } : null;
      });
      if (focused && focused.tag !== 'BODY') {
        tabStops++;
        if (!focused.hasOutline && focused.tag !== 'HTML') {
          // Many sites suppress outlines — this is a known issue
        }
      }
    }
    log(`Tab stops found: ${tabStops}`);
    if (tabStops < 5) {
      pain('HIGH', 'Accessibility', `Only ${tabStops} focusable elements via keyboard`, 'Add focus styles and tabindex', 'accessibility');
    }
    
    // Check all headings hierarchy
    await goto(page, '/dashboard');
    await sleep(2000);
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', els => els.map(el => parseInt(el.tagName[1])));
    let hierarchyBroken = false;
    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i-1] > 1) {
        hierarchyBroken = true;
        break;
      }
    }
    if (hierarchyBroken) {
      pain('MEDIUM', 'Accessibility', 'Heading hierarchy skips levels (e.g. h1 → h3)', 'Use sequential heading levels', 'accessibility');
    }
    
    // Check images without alt
    const allImgs = await page.$$eval('img', imgs => imgs.map(img => ({ src: img.src.substring(0, 50), alt: img.alt })));
    const noAlt = allImgs.filter(i => !i.alt && !i.src.includes('data:'));
    if (noAlt.length > 0) {
      pain('MEDIUM', 'Accessibility', `${noAlt.length} images missing alt text`, 'Add descriptive alt text', 'accessibility');
    }
    
    // Check links without accessible text
    const linksNoText = await page.$$eval('a', els => els.filter(el => {
      const text = el.textContent.trim();
      const ariaLabel = el.getAttribute('aria-label');
      const hasImg = el.querySelector('img');
      return !text && !ariaLabel && !hasImg;
    }).length);
    if (linksNoText > 0) {
      pain('MEDIUM', 'Accessibility', `${linksNoText} links with no accessible text`, 'Add aria-label or visible text', 'accessibility');
    }
    
    // Check forms without labels
    const inputsNoLabel = await page.$$eval('input:not([type="hidden"])', els => els.filter(el => {
      const hasLabel = el.labels?.length > 0;
      const hasAriaLabel = el.getAttribute('aria-label');
      const hasPlaceholder = el.placeholder;
      return !hasLabel && !hasAriaLabel && !hasPlaceholder;
    }).length);
    if (inputsNoLabel > 0) {
      pain('MEDIUM', 'Accessibility', `${inputsNoLabel} form inputs without labels`, 'Add <label> or aria-label', 'accessibility');
    }
    
    // Check color contrast (basic)
    const lowContrastCount = await page.evaluate(() => {
      const els = document.querySelectorAll('p, a, span, h1, h2, h3, button, label');
      let issues = 0;
      els.forEach(el => {
        const style = getComputedStyle(el);
        const color = style.color;
        const bg = style.backgroundColor;
        // Very basic: check if text color is similar to background
        if (color === bg && el.textContent.trim().length > 0) issues++;
      });
      return issues;
    });
    if (lowContrastCount > 0) {
      pain('MEDIUM', 'Accessibility', `${lowContrastCount} elements with same text/background color`, 'Fix color contrast', 'accessibility');
    }
    
    // Check skip-to-content link
    const skipLink = await page.$('a[href="#content"], a[href="#main"], [class*="skip"]');
    if (!skipLink) {
      pain('MEDIUM', 'Accessibility', 'No skip-to-content link', 'Add skip navigation link', 'accessibility');
    }
    
    // Check lang attribute
    const htmlLang = await page.$eval('html', el => el.getAttribute('lang'));
    if (!htmlLang) {
      pain('MEDIUM', 'Accessibility', 'No lang attribute on <html>', 'Add lang="en"', 'accessibility');
    }

    // ================================================================
    // PHASE 12: ERROR STATES & EDGE CASES
    // ================================================================
    console.log('\n===== PHASE 12: ERROR STATES =====');
    
    // Non-existent dashboard page
    await goto(page, '/dashboard/nonexistent-page-xyz');
    await sleep(2000);
    const neBody = await page.$eval('body', el => el.textContent.trim());
    if (!neBody.includes('404') && !neBody.includes('not found') && !neBody.includes('Not Found')) {
      pain('HIGH', 'Error Handling', 'Non-existent dashboard page shows no 404', 'Show custom 404 for dashboard', 'error-404');
    }
    await ss(page, 'error-dashboard-404');
    
    // Non-existent course
    await goto(page, '/courses/nonexistent-id');
    await sleep(2000);
    await ss(page, 'error-course-404');
    
    // Non-existent lab
    await goto(page, '/dashboard/labs/nonexistent-id');
    await sleep(2000);
    await ss(page, 'error-lab-404');

    // ================================================================
    // FINAL REPORT
    // ================================================================
    console.log('\n\n' + '='.repeat(60));
    console.log('RUTHLESS UAT COMPLETE');
    console.log(`Screenshots: ${screenshotNum}`);
    console.log(`Pain points: ${PAIN.length}`);
    console.log('='.repeat(60));
    
    // Write report
    const report = [
      '# XpertClass UAT Report — Ruthless Edition',
      `Date: ${new Date().toISOString()}`,
      `Total screenshots: ${screenshotNum}`,
      `Total pain points: ${PAIN.length}`,
      '',
      '## Pain Points by Severity',
      '',
      ...['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
        const items = PAIN.filter(p => p.sev === sev);
        if (items.length === 0) return '';
        return `### ${sev} (${items.length})\n` + items.map((p, i) => 
          `${i+1}. **${p.area}** [${p.page}]: ${p.desc}\n   Fix: ${p.fix}`
        ).join('\n') + '\n';
      }),
      '',
      '## Summary by Area',
      '',
      ...[...new Set(PAIN.map(p => p.area))].map(area => {
        const items = PAIN.filter(p => p.area === area);
        return `- **${area}**: ${items.length} issues`;
      }).filter(Boolean),
    ].filter(Boolean).join('\n');
    
    fs.writeFileSync(path.join(DIR, 'UAT-REPORT.md'), report);
    fs.writeFileSync(path.join(DIR, 'PAIN-POINTS.json'), JSON.stringify(PAIN, null, 2));
    
    console.log('\nReport: UAT-REPORT.md');
    console.log('JSON: PAIN-POINTS.json');
    
    // Print summary
    ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(sev => {
      const items = PAIN.filter(p => p.sev === sev);
      if (items.length > 0) {
        console.log(`\n${sev} (${items.length}):`);
        items.forEach(p => console.log(`  - [${p.area}] ${p.desc}`));
      }
    });

  } catch (err) {
    console.error('FATAL:', err.message);
    await ss(page, 'fatal-error');
  } finally {
    await browser.close();
  }
})();
