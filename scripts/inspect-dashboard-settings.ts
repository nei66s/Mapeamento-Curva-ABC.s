import pool from '../src/lib/db';

async function main(){
  try{
    const res = await pool.query('select key, value from admin_dashboard_settings');
    console.log('rows:', res.rowCount);
    for(const r of res.rows) {
      console.log(r.key, r.value);
    }
  }catch(e){
    console.error('inspect error', e && (e as any).message ? (e as any).message : e);
    process.exitCode = 1;
  } finally {
    try{ await pool.end(); }catch(e){}
  }
}

main();
