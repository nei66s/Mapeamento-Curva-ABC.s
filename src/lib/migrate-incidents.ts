import pool from './db';

/**
 * Create the `incidents` table with the expected columns used by the app.
 * Run with: npx ts-node src/lib/migrate-incidents.ts
 */
async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id text PRIMARY KEY
      )
    `);

    // Ensure expected columns exist (safe if table was pre-existing with different schema)
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS item_name text;`);
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location text;`);
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS description text;`);
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lat double precision DEFAULT 0;`);
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS lng double precision DEFAULT 0;`);
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS status text DEFAULT 'Aberto';`);
    await pool.query(`ALTER TABLE incidents ADD COLUMN IF NOT EXISTS opened_at timestamptz DEFAULT now();`);

    // Insert a small sample row for development if table is empty
    const { rowCount } = await pool.query(`SELECT 1 FROM incidents LIMIT 1`);
    if (rowCount === 0) {
      // Try inserting a sample row but don't fail the migration if the existing table has incompatible
      // schema (different columns / NOT NULL constraints). This keeps the migration safe for many
      // local DB states; the API route already falls back to empty array in dev when errors occur.
      try {
        await pool.query(
          `INSERT INTO incidents (item_name, location, description, lat, lng, status, opened_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            'Exemplo Item A',
            'Loja 01 - Americana',
            'Incidente de amostra para desenvolvimento',
            0,
            0,
            'Aberto',
            new Date().toISOString(),
          ]
        );
      } catch (e) {
        console.warn('Skipping sample insert: existing incidents table has incompatible schema', String(e));
      }
    }

    console.log('incidents migration complete.');
  } catch (e) {
    console.error('incidents migration failed', e);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
