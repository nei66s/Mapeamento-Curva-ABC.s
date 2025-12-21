const fs = require('fs');
const path = require('path');

const root = process.cwd();
const serverAppDir = path.join(root, '.next', 'server', 'app');

function findNftFiles(dir) {
  const res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      res.push(...findNftFiles(full));
    } else if (e.isFile() && e.name.endsWith('.nft.json')) {
      res.push(full);
    }
  }
  return res;
}

function ensureStub(manifestPath) {
  if (fs.existsSync(manifestPath)) return false;
  const content = "module.exports = { clientModules: {}, edgeRscModuleMapping: {}, rscModuleMapping: {} };\n";
  fs.writeFileSync(manifestPath, content, { encoding: 'utf8' });
  return true;
}

if (!fs.existsSync(serverAppDir)) {
  console.error('No .next/server/app directory found. Run `npm run build` first.');
  process.exit(2);
}

const nftFiles = findNftFiles(serverAppDir);
let created = 0;
for (const nftPath of nftFiles) {
  try {
    const json = JSON.parse(fs.readFileSync(nftPath, 'utf8'));
    if (!Array.isArray(json.files)) continue;
    const dir = path.dirname(nftPath);
    for (const fname of json.files) {
      if (fname.endsWith('page_client-reference-manifest.js') || fname.endsWith('route_client-reference-manifest.js')) {
        // Target path relative to nft file: the json uses relative paths, but manifests are expected in same directory
        const target = path.join(dir, path.basename(fname));
        if (ensureStub(target)) {
          console.log('Created stub manifest:', path.relative(root, target));
          created++;
        }
      }
    }
  } catch (err) {
    console.error('Failed to parse', nftPath, err && err.message);
  }
}

console.log(`Done. Created ${created} stub manifest(s).`);
process.exit(created>0?0:0);
