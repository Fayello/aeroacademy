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

async function goto(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 30000 });
  try { await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }); } catch {}
  await sleep(3000);
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
    // Login first
    console.log('Logging in...');
    await goto(page, '/login');
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (emailInput && passwordInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type(ADMIN_CREDS.email);
      await passwordInput.click({ clickCount: 3 });
      await passwordInput.type(ADMIN_CREDS.password);
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await sleep(4000);
    }
    // Skip onboarding
    const skipBtn = await page.$('text/Skip for now');
    if (skipBtn) { await skipBtn.click(); await sleep(3000); }
    console.log('Logged in, skipping onboarding...');

    // Pages that need re-capture (hit 429)
    const pages = [
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
      ['/dashboard/admin', '24-admin-dashboard'],
      ['/dashboard/admin/security', '25-admin-security'],
      ['/dashboard/admin/audit', '26-admin-audit'],
    ];

    for (const [route, name] of pages) {
      console.log(`Capturing ${name}...`);
      await goto(page, route);
      await ss(page, name);
    }

    // Course detail
    console.log('Capturing course detail...');
    await goto(page, '/courses');
    await sleep(2000);
    const courseLink = await page.$('a[href*="/courses/"]');
    if (courseLink) {
      await courseLink.click();
      await sleep(4000);
    }
    await ss(page, '28-course-detail');

    // Lab workspace
    console.log('Capturing lab workspace...');
    await goto(page, '/dashboard/labs');
    await sleep(3000);
    const labLink = await page.$('a[href*="/dashboard/labs/"]');
    if (labLink) {
      await labLink.click();
      await sleep(6000);
    }
    await ss(page, '29-lab-workspace');

    // Community
    console.log('Capturing community...');
    await goto(page, '/community');
    await ss(page, '30-community');

    // Forgot password
    console.log('Capturing forgot password...');
    await goto(page, '/forgot-password');
    await ss(page, '31-forgot-password');

    console.log('\n=== RETAKE COMPLETE ===');
  } catch (err) {
    console.error('ERROR:', err.message);
    await ss(page, 'error-state');
  } finally {
    await browser.close();
  }
})();
