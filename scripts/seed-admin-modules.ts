import pool from '../src/lib/db';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  const sqlPath = path.join(__dirname, '..', 'sql', 'seed-admin-modules-and-flags.sql');
  try {
    console.log('Reading SQL seed from', sqlPath);
    const sql = await fs.readFile(sqlPath, 'utf8');
    console.log('Executing seed...');
    await pool.query(sql);
    console.log('Seed executed successfully.');
  } catch (err) {
    console.error('seed-admin-modules error:', err && (err as any).message ? (err as any).message : err);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
  }
}

main();
