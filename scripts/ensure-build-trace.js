const fs = require('fs');
const path = require('path');

const tracePath = path.resolve(__dirname, '..', 'build', 'trace');

(async () => {
  try {
    const dir = path.dirname(tracePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(tracePath, '', { flag: 'w' });
    try { await fs.promises.chmod(tracePath, 0o666); } catch (_) {}
    console.log('OK: ensured build/trace');
  } catch (err) {
    console.warn('Warning: could not ensure build/trace:', err && err.message ? err.message : err);
    // Do not fail the build; this script is just a best-effort workaround for OneDrive permission issues
    process.exit(0);
  }
})();
