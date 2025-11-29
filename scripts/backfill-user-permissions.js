#!/usr/bin/env node
// Backfill per-user permissions from roles -> role_permissions -> permissions
// Usage: set PG env vars (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT) then run:
//   node scripts/backfill-user-permissions.js

const { Pool } = require('pg');

async function main() {
  const pool = new Pool();
  const client = await pool.connect();
  try {
    console.log('Starting users.permissions migration/backfill...');
    await client.query('BEGIN');

    console.log('Ensuring column users.permissions exists...');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB');

    console.log('Ensuring GIN index on users.permissions...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_permissions_gin ON users USING gin (permissions)');

    console.log('Computing per-user permissions from roles...');
    const updateSql = `
WITH perms AS (
 SELECT u.id, jsonb_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL) as perms
 FROM users u
 LEFT JOIN roles r ON r.id::text = u.role OR r.name = u.role
 LEFT JOIN role_permissions rp ON rp.role_id = r.id
 LEFT JOIN permissions p ON p.id = rp.permission_id
 GROUP BY u.id
)
UPDATE users u SET permissions = perms.perms
FROM perms
WHERE u.id = perms.id AND perms.perms IS NOT NULL
RETURNING u.id;
`;

    const res = await client.query(updateSql);
    console.log(`Updated ${res.rowCount} users with permissions.`);

    await client.query('COMMIT');
    console.log('Backfill complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during backfill:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) main();
