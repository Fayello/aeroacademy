const puppeteer = require('puppeteer-core');

const BASE = 'https://xpertclass.academy';
const CREDS = { email: 'admin@test.com', password: 'Test1234!' };

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[pageerror] ${err.message}\n${err.stack}`);
  });

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', CREDS.email);
  await page.type('input[type="password"]', CREDS.password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);

  console.log('=== LOGIN DONE ===');

  // Bypass onboarding by setting localStorage
  await page.evaluate(() => {
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('onboardingSelections', JSON.stringify({
      purpose: ['learn'],
      field: ['cybersecurity'],
      role: '',
      experience: '3-5',
      skills: ['security'],
      jobInterests: [],
    }));
  });

  const pages = ['/dashboard/teams', '/dashboard/battle-pass', '/dashboard/community'];

  for (const route of pages) {
    console.log(`\n=== TESTING ${route} ===`);
    errors.length = 0;
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasError = bodyText.includes('Something went wrong') || bodyText.includes('Application error') || bodyText.includes('Internal Server Error');
    console.log('Error boundary hit:', hasError);
    if (hasError) {
      console.log('Page errors:');
      errors.forEach(e => console.log(e));
    } else {
      console.log('Page loaded OK');
      console.log('Body preview:', bodyText.substring(0, 500));
    }
    console.log('Console errors count:', errors.length);
    if (errors.length > 0) {
      errors.forEach(e => console.log('  ERR:', e));
    }
  }

  await browser.close();
})();
