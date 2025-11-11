import pool from '../src/lib/db';

async function main() {
  try {
    const cols = await pool.query(`SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_name='incidents' ORDER BY ordinal_position`);
    console.log('columns:', cols.rows);

    const notnulls = await pool.query(`SELECT a.attname
      FROM pg_catalog.pg_attribute a
      JOIN pg_catalog.pg_class c ON a.attrelid = c.oid
      WHERE c.relname = 'incidents' AND a.attnum > 0 AND NOT a.attisdropped AND a.attnotnull`);
    console.log('not-null columns:', notnulls.rows.map(r => r.attname));
  } catch (err) {
    console.error(err && (err as any).message ? (err as any).message : err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch {}
  }
}

main();
