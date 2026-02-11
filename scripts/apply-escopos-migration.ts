import fs from 'fs';
import path from 'path';
import pool from '../src/lib/db';

(async function(){
  const p = path.resolve(__dirname, '..', 'sql', '20260210_create_escopos_table.sql');
  try {
    const sql = fs.readFileSync(p, 'utf8');
    console.log('Applying migration file:', p);
    await (pool as any).query(sql);
    console.log('Migration `escopos` applied successfully.');
    await (pool as any).end();
    process.exit(0);
  } catch (err) {
    console.error('Migration error', (err as any)?.message || err);
    try { await (pool as any).end(); } catch (e) {}
    process.exit(2);
  }
})();
