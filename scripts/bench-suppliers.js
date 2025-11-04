// Simple benchmark for /api/suppliers
// Usage: node scripts/bench-suppliers.js [URL] [requests] [concurrency]
// Example: node scripts/bench-suppliers.js http://localhost:9002/api/suppliers 100 10

const url = process.argv[2] || 'http://localhost:9002/api/suppliers';
const total = Number(process.argv[3]) || 100;
const concurrency = Number(process.argv[4]) || 10;

async function doRequest(i) {
  const start = Date.now();
  try {
    const res = await fetch(url);
    await res.text();
    const dt = Date.now() - start;
    return dt;
  } catch (err) {
    return { error: String(err) };
  }
}

async function run() {
  const results = [];
  let inFlight = 0;
  let done = 0;

  return new Promise((resolve) => {
    function next() {
      while (inFlight < concurrency && done + inFlight < total) {
        const idx = done + inFlight;
        inFlight++;
        doRequest(idx).then((r) => {
          inFlight--;
          done++;
          results.push(r);
          if (done >= total) {
            resolve(results);
          } else {
            next();
          }
        });
      }
    }
    next();
  });
}

(async () => {
  console.log(`Running ${total} requests to ${url} with concurrency ${concurrency}`);
  const res = await run();
  const times = res.filter(x => typeof x === 'number');
  const errors = res.filter(x => typeof x !== 'number');
  const count = times.length;
  const sum = times.reduce((a,b)=>a+b,0);
  const avg = sum / (count || 1);
  times.sort((a,b)=>a-b);
  const p50 = times[Math.floor(count*0.5)] || 0;
  const p95 = times[Math.floor(count*0.95)] || 0;
  const p99 = times[Math.floor(count*0.99)] || 0;
  console.log('Results:');
  console.log('  total requests:', total);
  console.log('  success:', count);
  console.log('  errors:', errors.length);
  console.log('  avg (ms):', avg.toFixed(2));
  console.log('  p50 (ms):', p50);
  console.log('  p95 (ms):', p95);
  console.log('  p99 (ms):', p99);
  if (errors.length) console.log('Sample error:', errors[0]);
})();
