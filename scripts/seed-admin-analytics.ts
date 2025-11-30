import pool from '../src/lib/db';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const sqlPath = path.join(__dirname, '..', 'sql', 'seed-admin-analytics.sql');
  try {
    console.log('Reading SQL migration from', sqlPath);
    const sql = await fs.readFile(sqlPath, 'utf8');
    console.log('Executing analytics seed...');
    await pool.query(sql);
    console.log('Analytics seed executed successfully.');
  } catch (err) {
    console.error('seed-admin-analytics error:', err && (err as any).message ? (err as any).message : err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
