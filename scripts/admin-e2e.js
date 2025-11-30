const { chromium } = require('playwright');

(async () => {
  const base = 'http://localhost:9002';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Visiting dev-login to set cookie...');
  const devLoginResp = await page.goto(base + '/api/admin/dev-login');
  console.log('dev-login status:', devLoginResp && devLoginResp.status());
  if (!devLoginResp || devLoginResp.status() !== 200) {
    console.error('dev-login failed; ensure dev server is running and DEV_ALLOW_ADMIN_AUTOLOGIN=true');
    await browser.close();
    process.exit(1);
  }

  // Use the context.request to call API endpoints reusing cookies
  const request = context.request;

  const endpoints = [
    '/api/admin-panel/metrics/timeseries?pageSize=5',
    '/api/admin-panel/metrics/realtime',
    '/api/admin-panel/audit/logs?pageSize=3',
    '/api/admin-panel/users?pageSize=5',
    '/api/admin-panel/modules',
    '/api/admin-panel/flags',
    '/api/admin-panel/session'
  ];

  const results = [];
  for (const ep of endpoints) {
    try {
      const r = await request.get(base + ep);
      const text = await r.text();
      let ok = true;
      let json = null;
      try { json = JSON.parse(text); } catch (e) { ok = false; }
      results.push({ endpoint: ep, status: r.status(), ok, json: json || text.slice(0, 400) });
      console.log(ep, '=>', r.status());
    } catch (e) {
      results.push({ endpoint: ep, error: String(e) });
      console.error(ep, 'error', e);
    }
  }

  console.log('\nSummary:');
  for (const r of results) {
    if (r.error) console.log(r.endpoint, 'ERROR', r.error);
    else console.log(r.endpoint, 'status', r.status, 'jsonOk', r.ok);
  }

  await browser.close();
  process.exit(0);
})();
