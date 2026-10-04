const puppeteer = require('puppeteer-core');
const { createReadStream, readFileSync, writeFileSync, mkdirSync } = require('fs');
const path = require('path');
const sharp = require('sharp');
const GIFEncoder = require('gif-encoder-2');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const URL = process.env.URL || 'http://localhost:8765/';
const OUT = process.env.OUT || path.join(__dirname, '..', 'docs', 'fdec-animation.gif');
const FRAMES = parseInt(process.env.FRAMES || '20', 10);
const WIDTH = 1440;
const HEIGHT = 900;

async function captureFrames() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--force-device-scale-factor=1'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));

  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const maxScroll = pageHeight - HEIGHT;
  const step = maxScroll / (FRAMES - 1);

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const scrollY = Math.min(i * step, maxScroll);
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await new Promise((r) => setTimeout(r, 300));
    const png = await page.screenshot({ type: 'png' });
    frames.push(png);
    console.log(`Frame ${i + 1}/${FRAMES} captured (scroll=${Math.round(scrollY)}px)`);
  }

  await browser.close();
  return frames;
}

async function createGif(frames) {
  const gifWidth = 720;
  const gifHeight = Math.round(gifWidth * HEIGHT / WIDTH);

  const encoder = new GIFEncoder(gifWidth, gifHeight);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(150);
  encoder.setQuality(10);
  encoder.setThreshold(20);

  for (let i = 0; i < frames.length; i++) {
    const resized = await sharp(frames[i])
      .resize(gifWidth, gifHeight, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const ctx = {
      canvas: { width: gifWidth, height: gifHeight },
      getImageData: () => ({ data: resized.data, width: gifWidth, height: gifHeight }),
    };
    encoder.addFrame(ctx);
    console.log(`Frame ${i + 1}/${frames.length} encoded`);
  }

  encoder.finish();
  const gifBuffer = encoder.out.getData();
  writeFileSync(OUT, gifBuffer);
  console.log(`GIF saved to ${OUT} (${(gifBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

(async () => {
  console.log(`Capturing ${FRAMES} frames from ${URL}...`);
  const frames = await captureFrames();
  console.log(`Creating GIF (${frames.length} frames)...`);
  await createGif(frames);
})().catch((e) => {
  console.error('GIF generation failed:', e.message);
  process.exit(1);
});