import pool from '../src/lib/db';

async function main(){
  try{
    console.log('Deleting demo tracking events...');
    await pool.query("delete from tracking_events where route like '/admin-panel%'");
    console.log('Deleting demo users...');
    await pool.query("delete from users where email like '%@demo.local'");
    console.log('Cleanup done');
  }catch(e){
    console.error('cleanup error', e && (e as any).message ? (e as any).message : e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
