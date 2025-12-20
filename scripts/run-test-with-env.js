const fs = require('fs');
const cp = require('child_process');

function loadDotEnv(path) {
  const env = {};
  if (!fs.existsSync(path)) return env;
  const data = fs.readFileSync(path, 'utf8');
  for (const line of data.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const [k, ...rest] = line.split('=');
    if (!k) continue;
    const v = rest.join('=');
    env[k.trim()] = v.replace(/^"|"$/g, '').trim();
  }
  return env;
}

const dot = loadDotEnv('.env');
const env = Object.assign({}, process.env, dot);

console.log('[run-test-with-env] loaded env keys:', Object.keys(dot));

const res = cp.spawnSync('npx', ['vitest', 'run', '--reporter=verbose'], { env, encoding: 'utf8' });
const out = (res.stdout || '') + '\n' + (res.stderr || '');
try {
  const logDir = 'tmp';
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  fs.writeFileSync(`${logDir}/test-run-full.log`, out, 'utf8');
  console.log('[run-test-with-env] test log written to tmp/test-run-full.log');
} catch (e) {
  console.warn('[run-test-with-env] failed to write log', e?.message || e);
}
if (res.status !== 0) {
  console.error(out);
}
process.exit(res.status || 0);
