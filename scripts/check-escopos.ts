import pool from '../src/lib/db';

(async function(){
  try {
    const res = await (pool as any).query("SELECT to_regclass('public.escopos') AS reg");
    console.log('to_regclass result:', res.rows);
    await (pool as any).end();
    process.exit(0);
  } catch (err) {
    console.error('query error', (err as any)?.message || err);
    try { await (pool as any).end(); } catch (e) {}
    process.exit(2);
  }
})();
