const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: '01-landing',         url: '/landing.html',    wait: 4000 },
  { name: '02-mission-control', url: '/console.html',    wait: 8000 },
  { name: '03-ssa-tactical',    url: '/conjunction.html', wait: 8000 },
  { name: '04-maneuver-planner',url: '/maneuvers.html',  wait: 8000 },
  { name: '05-fleet-telemetry', url: '/satellite.html',  wait: 6000 },
  { name: '06-autopilot',       url: '/autopilot.html',  wait: 6000 },
  { name: '07-analytics',       url: '/analytics.html',  wait: 6000 },
];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  for (const p of PAGES) {
    const url = BASE_URL + p.url;
    const filePath = path.join(SCREENSHOT_DIR, `${p.name}.png`);
    console.log(`\nCapturing ${p.name} -> ${url}`);

    try {
      const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log(`  HTTP ${response.status()}`);
      await new Promise(r => setTimeout(r, p.wait));

      const bodyLen = await page.evaluate(() => document.body.innerHTML.length);
      console.log(`  Body HTML length: ${bodyLen}`);

      await page.screenshot({ path: filePath, fullPage: false });
      const size = fs.statSync(filePath).size;
      console.log(`  Saved: ${filePath} (${(size/1024).toFixed(0)} KB)`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
    }
  }

  await browser.close();
  console.log('\nDone!');
})();
