const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://xpertclass.academy';
const SCREENSHOT_DIR = path.join(__dirname, 'output');
const ADMIN_CREDS = { email: 'admin@test.com', password: 'Test1234!' };

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ss(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`  [OK] ${name}.png`);
}

async function waitForLoad(page, timeout = 20000) {
  try { await page.waitForNetworkIdle({ idleTime: 1500, timeout }); } catch {}
}

async function goto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
  await waitForLoad(page);
}

(async () => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  try {
    // ===== PUBLIC PAGES =====
    console.log('\n=== PUBLIC PAGES ===');

    console.log('1. Homepage');
    await goto(page, '');
    await ss(page, '01-homepage');

    console.log('2. Courses');
    await goto(page, '/courses');
    await ss(page, '02-courses');

    console.log('3. Labs');
    await goto(page, '/labs');
    await ss(page, '03-labs');

    console.log('4. Login');
    await goto(page, '/login');
    await ss(page, '04-login');

    console.log('5. Register');
    await goto(page, '/register');
    await ss(page, '05-register');

    // ===== ADMIN LOGIN =====
    console.log('\n=== ADMIN LOGIN ===');
    await goto(page, '/login');
    await sleep(2000);

    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    if (emailInput && passwordInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(ADMIN_CREDS.email);
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(ADMIN_CREDS.password);
      await ss(page, '06-login-filled');

      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await sleep(4000);
      await waitForLoad(page);
      console.log(`  After login URL: ${page.url()}`);
      await ss(page, '07-after-login');
    }

    // Skip onboarding if present
    console.log('  Skipping onboarding...');
    const skipBtn = await page.$('text/Skip for now');
    if (skipBtn) {
      await skipBtn.click();
      await sleep(3000);
      await waitForLoad(page);
      console.log(`  After skip URL: ${page.url()}`);
    } else {
      // Try navigating directly to dashboard
      await goto(page, '/dashboard');
    }
    await ss(page, '08-dashboard');

    // ===== DASHBOARD PAGES =====
    console.log('\n=== DASHBOARD PAGES ===');

    const dashPages = [
      ['/dashboard', '08-dashboard'],
      ['/dashboard/courses', '09-dashboard-courses'],
      ['/dashboard/labs', '10-labs-dashboard'],
      ['/dashboard/starting-point', '11-starting-point'],
      ['/dashboard/certifications', '12-certifications'],
      ['/dashboard/leaderboard', '13-leaderboard'],
      ['/dashboard/teams', '14-teams'],
      ['/dashboard/guilds', '15-guilds'],
      ['/dashboard/challenges', '16-challenges'],
      ['/dashboard/badges', '17-badges'],
      ['/dashboard/achievements', '18-achievements'],
      ['/dashboard/streak', '19-streak'],
      ['/dashboard/battle-pass', '20-battle-pass'],
      ['/dashboard/assessments', '21-assessments'],
      ['/dashboard/profile', '22-profile'],
      ['/dashboard/settings', '23-settings'],
    ];

    for (const [route, name] of dashPages) {
      console.log(`${name}`);
      await goto(page, route);
      await ss(page, name);
    }

    // ===== ADMIN PAGES =====
    console.log('\n=== ADMIN PAGES ===');

    const adminPages = [
      ['/dashboard/admin', '24-admin-dashboard'],
      ['/dashboard/admin/security', '25-admin-security'],
      ['/dashboard/admin/audit', '26-admin-audit'],
    ];

    for (const [route, name] of adminPages) {
      console.log(`${name}`);
      await goto(page, route);
      await ss(page, name);
    }

    // ===== ONBOARDING =====
    console.log('\n=== ONBOARDING ===');
    await goto(page, '/onboarding');
    await ss(page, '27-onboarding-step1');

    // ===== COURSE DETAIL =====
    console.log('\n=== COURSE DETAIL ===');
    await goto(page, '/courses');
    await sleep(2000);
    const courseLink = await page.$('a[href*="/courses/"]');
    if (courseLink) {
      await courseLink.click();
      await sleep(3000);
      await waitForLoad(page);
      console.log(`  Course detail URL: ${page.url()}`);
    }
    await ss(page, '28-course-detail');

    // ===== LAB WORKSPACE =====
    console.log('\n=== LAB WORKSPACE ===');
    await goto(page, '/dashboard/labs');
    await sleep(3000);
    const labLink = await page.$('a[href*="/dashboard/labs/"]');
    if (labLink) {
      await labLink.click();
      await sleep(5000);
      await waitForLoad(page);
      console.log(`  Lab workspace URL: ${page.url()}`);
    }
    await ss(page, '29-lab-workspace');

    // ===== COMMUNITY =====
    console.log('\n=== COMMUNITY ===');
    await goto(page, '/community');
    await ss(page, '30-community');

    // ===== FORGOT PASSWORD =====
    console.log('\n=== FORGOT PASSWORD ===');
    await goto(page, '/forgot-password');
    await ss(page, '31-forgot-password');

    // ===== TERMS & PRIVACY =====
    console.log('\n=== TERMS & PRIVACY ===');
    await goto(page, '/terms');
    await ss(page, '32-terms');
    await goto(page, '/privacy');
    await ss(page, '33-privacy');

    console.log('\n=== ALL SCREENSHOTS COMPLETE ===');
    console.log(`Output: ${SCREENSHOT_DIR}`);

  } catch (err) {
    console.error('ERROR:', err.message);
    await ss(page, 'error-state');
  } finally {
    await browser.close();
  }
})();
