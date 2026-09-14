const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'captures');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  // Login
  console.log('Logging in...');
  await page.goto('https://xpertclass.academy/login');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"], input[name="email"]', 'admin@test.com');
  await page.fill('input[type="password"], input[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  // Check if logged in
  const url = page.url();
  console.log('Current URL:', url);

  // Capture pages
  const pages_to_capture = [
    { url: '/dashboard', name: 'dashboard', wait: 2000 },
    { url: '/labs', name: 'labs-list', wait: 2000 },
    { url: '/dashboard/battle-pass', name: 'battle-pass', wait: 2000 },
    { url: '/dashboard/my-missions', name: 'daily-missions', wait: 2000 },
    { url: '/dashboard/leaderboard', name: 'leaderboard', wait: 2000 },
    { url: '/dashboard/labs', name: 'labs-dashboard', wait: 2000 },
  ];

  for (const p of pages_to_capture) {
    console.log(`Capturing ${p.name}...`);
    await page.goto('https://xpertclass.academy' + p.url);
    await page.waitForTimeout(p.wait);
    await page.screenshot({ path: path.join(OUT, p.name + '.png'), fullPage: false });
  }

  // Try to get a lab detail page
  console.log('Capturing lab detail...');
  await page.goto('https://xpertclass.academy/labs');
  await page.waitForTimeout(2000);
  // Click first lab if available
  const labLink = await page.$('a[href*="/labs/"]');
  if (labLink) {
    await labLink.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, 'lab-detail.png'), fullPage: false });
  }

  await browser.close();
  console.log('Done. Captures in:', OUT);
})();
