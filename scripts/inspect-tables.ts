import pool from '../src/lib/db';

async function inspect(table: string) {
  const res = await pool.query("select column_name from information_schema.columns where table_name = $1 order by ordinal_position", [table]);
  console.log('Table', table, 'columns:');
  for (const r of res.rows) console.log(' -', r.column_name);
}

async function main(){
  try{
    await inspect('users');
    await inspect('tracking_events');
    await inspect('admin_dashboard_settings');
    await inspect('metrics_cache');
  }catch(e){
    console.error('inspect error', e && (e as any).message ? (e as any).message : e);
  } finally {
    await pool.end();
  }
}

main();
