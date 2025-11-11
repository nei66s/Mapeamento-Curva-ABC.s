#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const ignore = ['node_modules', '.git', '.next', 'public', 'dist'];

const patterns = [
  { name: "PGPASSWORD fallback", re: /process\.env\.PGPASSWORD\s*\|\|\s*['\"]admin['\"]/ },
  { name: "Likely secret key", re: /(apiKey|api_key|apikey|secret|token)\s*[:=]\s*['\"][^'\"]{6,}['\"]/i },
  { name: "Plain password field", re: /password\s*[:=]\s*['\"][^'\"]{1,}['\"]/i }
];

const results = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (ignore.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
    } else if (e.isFile()) {
      if (/\.png$|\.jpg$|\.jpeg$|\.gif$|\.lock$|\.bin$/.test(e.name)) continue;
      const txt = fs.readFileSync(full, 'utf8');
      patterns.forEach(p => {
        const m = txt.match(p.re);
        if (m) results.push({ file: full, pattern: p.name, match: m[0] });
      });
    }
  }
}

walk(repoRoot);

if (results.length > 0) {
  console.error('Potential secrets / unsafe patterns found:');
  results.forEach(r => {
    console.error(`- ${r.file}: ${r.pattern} -> ${r.match}`);
  });
  process.exitCode = 2;
  process.exit(2);
} else {
  console.log('No obvious secrets or unsafe patterns found.');
}
