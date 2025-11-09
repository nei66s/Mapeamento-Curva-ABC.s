const http = require('http');

function request(path) {
  return new Promise((resolve) => {
    const opts = { hostname: 'localhost', port: 9002, path, method: 'GET', timeout: 5000 };
    const req = http.request(opts, (res) => {
      resolve({ status: res.statusCode });
    });
    req.on('error', (err) => resolve({ error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
    req.end();
  });
}

async function main() {
  console.log('Smoke test: polling /api/indicators until 200 (max 60s)...');
  const start = Date.now();
  let ok = false;
  for (let i = 0; i < 60; i++) {
    const r = await request('/api/indicators');
    if (r.status === 200) { ok = true; break; }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('=> /api/indicators available:', ok);

  const endpoints = ['/api/indicators', '/api/incidents', '/api/indicators?detailed=1'];
  for (const ep of endpoints) {
    const res = await request(ep);
    if (res.status) console.log(`${ep} -> ${res.status}`);
    else console.log(`${ep} -> ERROR: ${res.error}`);
  }

  console.log('Elapsed (ms):', Date.now() - start);
  process.exit(0);
}

main().catch((e) => { console.error('Smoke test failed:', e); process.exit(2); });
