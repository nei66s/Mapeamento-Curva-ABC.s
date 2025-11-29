const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = 'reports/ui-snapshots';
  fs.mkdirSync(outDir, { recursive: true });

  const base = process.env.BASE_URL || 'http://localhost:9002';
  const pages = [
    { path: '/', name: 'home' },
    { path: '/indicators', name: 'indicators' },
    { path: '/incidents', name: 'incidents' },
  ];

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  for (const p of pages) {
    const url = base.replace(/\/$/, '') + p.path;
    console.log('Navigating to', url);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      // small delay to let animations settle
      await page.waitForTimeout(400);
      const file = `${outDir}/${p.name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log('Saved', file);
    } catch (err) {
      console.error('Failed to capture', url, err.message || err);
    }
  }

  await browser.close();
  console.log('Snapshots complete.');
})();
