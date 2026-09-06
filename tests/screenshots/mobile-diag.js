const puppeteer = require('puppeteer-core');

const BASE = 'https://xpertclass.academy';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 375, height: 812 },
  });
  const page = await browser.newPage();

  // Check mobile courses page
  await page.goto(`${BASE}/courses`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  console.log('Courses horizontal overflow:', hasHorizontalOverflow);
  
  // Get the overflowing element
  if (hasHorizontalOverflow) {
    const overflowingEl = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const els = document.querySelectorAll('*');
      const results = [];
      for (const el of els) {
        const rect = el.getBoundingClientRect();
        if (rect.right > docWidth + 5) {
          results.push({
            tag: el.tagName,
            class: el.className?.substring?.(0, 100) || '',
            text: el.textContent?.substring(0, 50) || '',
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
        }
      }
      return results.slice(0, 5);
    });
    console.log('Overflowing elements:', JSON.stringify(overflowingEl, null, 2));
  }
  
  await browser.close();
})();
