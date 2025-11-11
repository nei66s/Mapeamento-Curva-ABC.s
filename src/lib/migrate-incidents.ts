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

    // If an existing incidents table was created previously with a numeric id (serial/int),
    // convert the column to text so the application can use string IDs like "INC-<uuid>".
    // This operation is safe for most local/dev databases: it drops any default (serial)
    // and converts the column using id::text. We only run it when the column exists and
    // is not already type 'text'.
    try {
      const col = await pool.query(
        `SELECT data_type, column_default
           FROM information_schema.columns
          WHERE table_name = 'incidents' AND column_name = 'id'`
      );
      if (col.rowCount > 0) {
        const dt = String(col.rows[0].data_type || '').toLowerCase();
        if (dt !== 'text') {
          console.log(`migrate-incidents: converting incidents.id from ${dt} to text`);
          try {
            // remove any numeric sequence default (e.g. nextval(...)) before changing type
            await pool.query(`ALTER TABLE incidents ALTER COLUMN id DROP DEFAULT`);
          } catch (e) {
            // ignore if no default existed
          }
          await pool.query(`ALTER TABLE incidents ALTER COLUMN id TYPE text USING id::text`);

          // ensure primary key exists (if previously absent)
          const pk = await pool.query(
            `SELECT constraint_name FROM information_schema.table_constraints
               WHERE table_name = 'incidents' AND constraint_type = 'PRIMARY KEY'`
          );
          if (pk.rowCount === 0) {
            try {
              await pool.query(`ALTER TABLE incidents ADD PRIMARY KEY (id)`);
            } catch (e) {
              console.warn('migrate-incidents: failed to add primary key after type conversion', String(e));
            }
          }
        }
      }
    } catch (e) {
      console.warn('migrate-incidents: could not inspect/convert incidents.id column', String(e));
    }

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
