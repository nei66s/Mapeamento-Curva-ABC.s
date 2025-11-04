import pool from './db';

/**
 * Ensure items table has the expected columns used by the app.
 * Run with: npx ts-node src/lib/migrate-items-schema.ts
 */
async function migrate() {
  try {
    // Add classification
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS classification text;`);

    // Add impact_factors as jsonb
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS impact_factors jsonb DEFAULT '[]'::jsonb;`);

    // Add status
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS status text DEFAULT 'offline';`);

    // Add contingency_plan
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS contingency_plan text DEFAULT '';`);

    // Add lead_time
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS lead_time text DEFAULT '';`);

    // Add image_url
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url text;`);

    console.log('items schema migration complete.');
  } catch (e) {
    console.error('items schema migration failed', e);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch {}
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
