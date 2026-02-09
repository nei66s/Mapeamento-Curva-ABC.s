const fs = require('fs');
const path = require('path');

const root = process.cwd();
const serverAppDirCandidates = [
  path.join(root, '.next', 'server', 'app'),
  path.join(root, 'build', 'server', 'app'),
];

function findServerAppDir() {
  for (const d of serverAppDirCandidates) {
    if (fs.existsSync(d)) return d;
  }
  return null;
}

const serverAppDir = findServerAppDir();

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

if (!serverAppDir) {
  console.error('No server app directory found (.next/server/app or build/server/app). Run `npm run build` first.');
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

// Patch compiled page routes to use fallback manifest
function patchCompiledRoutes() {
  const candidates = [
    path.join(root, '.next', 'server', 'app', '(app-shell)', 'page.js'),
    path.join(root, 'build', 'server', 'app', '(app-shell)', 'page.js'),
  ];
  let totalPatched = 0;
  const before = 'serverActionsManifest:X,clientReferenceManifest:Y,setIsrStatus:';
  const after = 'serverActionsManifest:X,clientReferenceManifest:Y??{clientModules:{},edgeRscModuleMapping:{},rscModuleMapping:{}},setIsrStatus:';

  for (const pagePath of candidates) {
    if (!fs.existsSync(pagePath)) continue;
    let content = fs.readFileSync(pagePath, 'utf8');
    if (content.includes(before) && !content.includes(after)) {
      content = content.replace(before, after);
      fs.writeFileSync(pagePath, content, 'utf8');
      console.log('Patched', path.relative(root, pagePath), 'with manifest fallback');
      totalPatched++;
    }
  }
  return totalPatched;
}

const patched = patchCompiledRoutes();
console.log(`Patched ${patched} route(s).`);
// Ensure top-level build routes manifest exists for runtimes expecting `build/`
try {
  const buildRoutes = path.join(root, 'build', 'routes-manifest.json');
  if (!fs.existsSync(buildRoutes)) {
    fs.writeFileSync(buildRoutes, JSON.stringify({}, null, 2), 'utf8');
    console.log('Created fallback:', path.relative(root, buildRoutes));
  }
  // Also create .next/routes-manifest.json as some runtimes (Vercel) expect it
  try {
    const nextRoutes = path.join(root, '.next', 'routes-manifest.json');
    if (!fs.existsSync(nextRoutes)) {
      const nextDir = path.dirname(nextRoutes);
      if (!fs.existsSync(nextDir)) fs.mkdirSync(nextDir, { recursive: true });
      fs.writeFileSync(nextRoutes, JSON.stringify({}, null, 2), 'utf8');
      console.log('Created fallback:', path.relative(root, nextRoutes));
    }
  } catch (e) {
    // ignore
  }
} catch (e) {
  // ignore
}

// Ensure a minimal pages/_document.js exists in build if some runtime expects it
try {
  const docDir = path.join(root, 'build', 'server', 'pages');
  const docPath = path.join(docDir, '_document.js');
  if (!fs.existsSync(docPath)) {
    if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
    const content = "module.exports = function Document() { return null; };\n";
    fs.writeFileSync(docPath, content, 'utf8');
    console.log('Created fallback stub:', path.relative(root, docPath));
  }
} catch (e) {
  // ignore
}

process.exit(0);
