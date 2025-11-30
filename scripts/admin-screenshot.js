const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const base = 'http://localhost:9002';
  const maxWait = 30000; // 30s
  const interval = 1000;
  const start = Date.now();

  // wait for server up
  while (Date.now() - start < maxWait) {
    try {
      const r = await (await import('node-fetch')).default(base + '/api/health', { method: 'GET' });
      if (r && r.status && r.status < 500) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, interval));
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Visiting dev-login to set cookie...');
  const devLogin = await page.goto(base + '/api/admin/dev-login');
  console.log('dev-login status:', devLogin && devLogin.status());
  if (!devLogin || devLogin.status() !== 200) {
    console.error('dev-login failed; ensure dev server is running and DEV_ALLOW_ADMIN_AUTOLOGIN=true');
    await browser.close();
    process.exit(1);
  }

  console.log('Opening admin panel...');
  await page.goto(base + '/admin-panel');

  // wait for the 'Últimos logins' text to appear and try to capture its containing element
  const outDir = 'screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  try {
    await page.waitForSelector('text="Últimos logins"', { timeout: 15000 });
    const label = await page.locator('text="Últimos logins"').first();
    // try to find the nearest ancestor card/table to screenshot
    const card = label.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "_card")]');
    if (await card.count()) {
      const outPath = `${outDir}/admin-panel-last-logins.png`;
      await card.first().screenshot({ path: outPath });
      console.log('Saved focused screenshot to', outPath);
    } else {
      const outPath = `${outDir}/admin-panel.png`;
      await page.screenshot({ path: outPath, fullPage: true });
      console.log('Saved full page screenshot to', outPath);
    }
  } catch (e) {
    console.warn('Timed out waiting for Últimos logins label; saving full page screenshot.');
    const outPath = `${outDir}/admin-panel.png`;
    await page.screenshot({ path: outPath, fullPage: true });
    console.log('Saved full page screenshot to', outPath);
  }
  // done

  await browser.close();
  process.exit(0);
})();
