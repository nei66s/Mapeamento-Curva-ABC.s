const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

async function runSqlFile(client, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('SQL file not found, skipping:', filePath);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  // Prefer sending the whole file in one query to preserve DO $$ blocks and
  // dollar-quoted bodies. If that fails (rare), fall back to a safer parser.
  try {
    await client.query(raw);
    return;
  } catch (err) {
    // fallback: attempt to split statements but respect dollar-quoted blocks
    const out = [];
    let current = '';
    let i = 0;
    let inDollar = false;
    let dollarTag = null;
    while (i < raw.length) {
      const ch = raw[i];
      // detect start of $$ or $tag$
      if (!inDollar && ch === '$') {
        // try to match $tag$
        const m = raw.slice(i).match(/^\$([a-zA-Z0-9_]*)\$/);
        if (m) {
          inDollar = true;
          dollarTag = m[1];
          const tag = `$${dollarTag}$`;
          current += tag;
          i += tag.length;
          continue;
        }
      }
      if (inDollar) {
        // look for closing $tag$
        const closeTag = `$${dollarTag}$`;
        if (raw.slice(i, i + closeTag.length) === closeTag) {
          current += closeTag;
          i += closeTag.length;
          inDollar = false;
          dollarTag = null;
          continue;
        }
        current += ch;
        i++;
        continue;
      }

      // normal parsing outside dollar blocks
      if (ch === ';') {
        // include semicolon and push
        current += ch;
        const stmt = current.trim();
        if (stmt) out.push(stmt);
        current = '';
        i++;
        continue;
      }

      current += ch;
      i++;
    }
    if (current.trim()) out.push(current.trim());

    for (let j = 0; j < out.length; j++) {
      const stmt = out[j];
      try {
        await client.query(stmt);
      } catch (e2) {
        console.error('Error executing statement index', j, 'from', path.basename(filePath));
        console.error(stmt.slice(0, 2000));
        throw e2;
      }
    }
    return;
  }
}

async function main() {
  const useMain = process.argv.includes('--use-main-db');
  const dbUrlArg = parseArg('--database-url', '--db-url');
  const passwordArg = parseArg('--password', '--pgpassword');

  const databaseUrl = dbUrlArg || (useMain ? process.env.MAIN_DATABASE_URL : undefined) || process.env.DATABASE_URL;

  const password = process.env.PGPASSWORD || passwordArg;
  if (!databaseUrl && !password) {
    console.error('Provide database credentials: set PGPASSWORD env or pass --password');
    process.exit(1);
  }

  const clientConfig = databaseUrl
    ? { connectionString: databaseUrl }
    : {
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
        user: process.env.PGUSER || 'postgres',
        password: password,
        database: process.env.PGDATABASE || 'postgres',
      };

  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to Postgres', databaseUrl ? databaseUrl : `${client.host}:${client.port}/${client.database}`);

    const sqlDir = path.resolve(__dirname, '..', 'sql');
    const createSql = path.join(sqlDir, 'create-admin-tables.sql');
    const seedSql = path.join(sqlDir, 'seed-admin-modules-and-flags.sql');

    console.log('Applying admin table migrations (idempotent)...');
    await runSqlFile(client, createSql);

    // Ensure legacy installations with an older `modules` schema get the
    // missing columns so the seed INSERT ... ON CONFLICT works.
    try {
      await client.query(`ALTER TABLE IF EXISTS modules
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS beta BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS experimental BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS dependencies TEXT[],
        ADD COLUMN IF NOT EXISTS owner TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`);
    } catch (e) {
      // non-fatal; continue to seeding
    }

    try {
      await client.query(`ALTER TABLE IF EXISTS feature_flags
        ADD COLUMN IF NOT EXISTS label TEXT,
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS module_id TEXT,
        ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS audience TEXT,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();`);
    } catch (e) {
      // ignore
    }

    console.log('Seeding modules and feature flags...');
    await runSqlFile(client, seedSql);

    console.log('Seed completed successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin modules/flags:', err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
}

main();
