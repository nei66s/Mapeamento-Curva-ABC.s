const fs = require('fs');

function parseArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv.length > idx + 1) return process.argv[idx + 1];
  return undefined;
}

async function main() {
  const id = parseArg('--id');
  const val = parseArg('--value') || 'true';
  if (!id) {
    console.error('Usage: node scripts/toggle-beta.js --id <module-id> [--value true|false]');
    process.exit(1);
  }

  const tokenPath = './tmp-admin-token.txt';
  if (!fs.existsSync(tokenPath)) {
    console.error('Token file not found at', tokenPath);
    process.exit(1);
  }
  // Read token as latin1 to avoid UTF-8 replacement characters, then
  // remove any characters that are not valid in a JWT (base64url + dot + =)
  let raw = fs.readFileSync(tokenPath, 'latin1');
  // Normalize line endings and whitespace
  raw = raw.replace(/\r?\n/g, '').trim();
  const token = raw.replace(/[^A-Za-z0-9._\-~=]/g, '');

  const url = `http://localhost:9002/api/admin/modules/${id}/beta`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ beta: val === 'true' }),
    });
    const text = await res.text();
    console.log(res.status, text);
  } catch (err) {
    console.error('Request failed:', err);
    process.exit(1);
  }
}

main();
