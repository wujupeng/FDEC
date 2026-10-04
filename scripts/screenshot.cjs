const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.URL || 'http://localhost:8765/';
const OUT = process.env.OUT || path.join(__dirname, '..', 'docs', 'screenshot.png');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=2'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: OUT, fullPage: true, type: 'png' });
  await browser.close();
  console.log('Screenshot saved to', OUT);
})().catch((e) => {
  console.error('Screenshot failed:', e.message);
  process.exit(1);
});