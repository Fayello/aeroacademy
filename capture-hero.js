const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Users/fayell.kuobi/Desktop/AEROACADEMY/node_modules/playwright-core/.local-browsers/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('https://xpertclass.academy', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // LinkedIn optimal: 1.91:1 ratio → 1440 x 754, cut above journey cards
  await page.screenshot({
    path: 'C:/Users/fayell.kuobi/Desktop/AEROACADEMY/linkedin-hero.png',
    clip: { x: 0, y: 0, width: 1440, height: 580 }
  });
  
  console.log('All 3 variants saved');
  await browser.close();
})();
