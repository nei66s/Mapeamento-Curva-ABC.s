const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-prod';
const userId = process.argv[2];
if (!userId) { console.error('user id missing'); process.exit(2); }
const header = { alg: 'HS256', typ: 'JWT' };
const payload = { sub: userId, role: 'admin', type: 'access', exp: Math.floor(Date.now() / 1000) + 3600 };
const h = Buffer.from(JSON.stringify(header)).toString('base64url');
const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
const sig = crypto.createHmac('sha256', SECRET).update(h + '.' + p).digest('base64url');
console.log(`${h}.${p}.${sig}`);
