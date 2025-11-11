/* eslint-disable */
import pool from './db';
import { mockMaintenanceIndicators } from './mock-data';

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS indicators (
      id TEXT PRIMARY KEY,
      mes TEXT NOT NULL,
      data JSONB NOT NULL
    );
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_indicators_mes ON indicators (mes);`);
}

async function migrate() {
  try {
    console.log('[migrate] starting indicators migration, rows:', mockMaintenanceIndicators.length);
    await ensureTable();
    let inserted = 0;
    for (const item of mockMaintenanceIndicators) {
      const id = item.mes;
      await pool.query(
        'INSERT INTO indicators (id, mes, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, mes = EXCLUDED.mes',
        [id, item.mes, JSON.stringify(item)]
      );
      inserted++;
    }
    console.log(`[migrate] done. inserted/updated ${inserted} rows`);
    process.exit(0);
  } catch (err) {
    console.error('[migrate] error', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

export default migrate;
