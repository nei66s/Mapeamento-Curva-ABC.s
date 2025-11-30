import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';

// This integration test runs the users migration and backfill against a real DB.
// It is intentionally gated: set RUN_USERS_MIGRATION_TEST=true in your environment
// to enable it. This prevents accidental execution against production DBs.

const MIGRATE_SQL = path.join(process.cwd(), 'sql', 'migrate-unify-users.sql');
const BACKFILL_SQL = path.join(process.cwd(), 'sql', 'backfill-user-profile.sql');

const shouldRun = process.env.RUN_USERS_MIGRATION_TEST === 'true';

describe.skipUnless(shouldRun, 'users migration integration', () => {
  beforeAll(async () => {
    // nothing
  });

  afterAll(async () => {
    await pool.end();
  });

  test('migration + backfill create profile for existing user', async () => {
    // Create minimal users/roles for test
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      role TEXT,
      password TEXT,
      avatarUrl TEXT,
      supplier_id TEXT,
      department TEXT
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )`);

    // Insert test role and user
    await pool.query(`INSERT INTO roles (name, description) VALUES ('test-role','teste') ON CONFLICT (name) DO NOTHING`);
    const userRes = await pool.query(`INSERT INTO users (name, email, role, avatarUrl, department, supplier_id)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`, ['ITest', 'itest@example.com', 'test-role', 'https://example.com/1.png', 'Ops', 'sup-1']);
    const userId = String(userRes.rows[0].id);

    // Run migration SQL file (idempotent)
    const migrateSql = fs.readFileSync(MIGRATE_SQL, 'utf8');
    await pool.query(migrateSql);

    // Run backfill
    const backfillSql = fs.readFileSync(BACKFILL_SQL, 'utf8');
    await pool.query(backfillSql);

    // Check profile
    const profRes = await pool.query('SELECT extra FROM user_profile WHERE user_id = $1 LIMIT 1', [userId]);
    expect(profRes.rowCount).toBeGreaterThanOrEqual(1);
    const extra = profRes.rows[0].extra;
    expect(extra).toHaveProperty('avatar_url');
    expect(extra).toHaveProperty('department');
    expect(extra).toHaveProperty('supplier_id');
  }, 30000);
});
