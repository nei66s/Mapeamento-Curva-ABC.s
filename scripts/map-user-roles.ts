import pool from '../src/lib/db';

async function main(){
  try{
    const res = await pool.query(`INSERT INTO user_roles (user_id, role_id)
      SELECT u.id::text, r.id::text
      FROM users u
      JOIN roles r ON LOWER(u.role) = LOWER(r.name)
      ON CONFLICT (user_id, role_id) DO NOTHING
      RETURNING user_id, role_id`);
    console.log('inserted mappings:', res.rowCount);
  }catch(e){
    console.error('map-user-roles error', e && (e as any).message ? (e as any).message : e);
  } finally {
    await pool.end();
  }
}

main();
