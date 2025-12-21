#!/usr/bin/env node
const fs = require('fs');
const net = require('net');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
let envRaw = '';
try {
  envRaw = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('Could not read .env:', e.message || e);
  process.exit(1);
}

function getEnvValue(key) {
  const re = new RegExp('^' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + "=(.*)$", 'm');
  const m = envRaw.match(re);
  return m ? m[1].trim() : undefined;
}

let host = getEnvValue('PGHOST');
let port = getEnvValue('PGPORT');
const databaseUrl = getEnvValue('DATABASE_URL');

if ((!host || !port) && databaseUrl) {
  try {
    const u = new URL(databaseUrl);
    host = host || u.hostname;
    port = port || (u.port ? u.port : '5432');
  } catch (e) {
    console.error('Failed to parse DATABASE_URL:', e.message || e);
    process.exit(2);
  }
}

if (!host) {
  console.error('No host found in PGHOST or DATABASE_URL');
  process.exit(3);
}
if (!port) port = '5432';

const timeoutMs = 4000;
console.log(`Checking TCP reachability to ${host}:${port} (timeout ${timeoutMs}ms)...`);

const socket = new net.Socket();
let done = false;
const onSuccess = () => {
  if (done) return; done = true;
  console.log(JSON.stringify({ host, port: Number(port), reachable: true }));
  socket.destroy();
  process.exit(0);
};
const onFail = (reason) => {
  if (done) return; done = true;
  console.log(JSON.stringify({ host, port: Number(port), reachable: false, reason }));
  try { socket.destroy(); } catch (_) {}
  process.exit(4);
};

socket.setTimeout(timeoutMs, () => onFail('timeout'));
socket.once('error', (err) => onFail(err && err.message ? err.message : String(err)));
socket.connect({ host, port: Number(port) }, onSuccess);
