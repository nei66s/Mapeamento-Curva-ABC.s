import pool from '../src/lib/db';

async function main(){
  try{
    console.log('information_schema for permissions, roles, role_permissions, user_roles:');
    const permsCols = await pool.query("select column_name from information_schema.columns where table_name='permissions'");
    const rolesCols = await pool.query("select column_name from information_schema.columns where table_name='roles'");
    const rpCols = await pool.query("select column_name from information_schema.columns where table_name='role_permissions'");
    const urCols = await pool.query("select column_name from information_schema.columns where table_name='user_roles'");
    console.log('permissions:', permsCols.rows.map(r=>r.column_name));
    console.log('roles:', rolesCols.rows.map(r=>r.column_name));
    console.log('role_permissions:', rpCols.rows.map(r=>r.column_name));
    console.log('user_roles:', urCols.rows.map(r=>r.column_name));

    // Show sample rows (safely) mapping by casting ids to text
    try{
      const rp = await pool.query("select rp.role_id, rp.permission_id from role_permissions rp limit 10");
      console.log('role_permissions (sample raw):', rp.rows);
    }catch(e){console.error('rp sample error', e && (e as any).message ? (e as any).message : e)}

    try{
      const ur = await pool.query("select ur.user_id, ur.role_id from user_roles ur limit 10");
      console.log('user_roles (sample raw):', ur.rows);
    }catch(e){console.error('ur sample error', e && (e as any).message ? (e as any).message : e)}

    const permCount = await pool.query('select count(*)::int as c from permissions');
    const roleCount = await pool.query('select count(*)::int as c from roles');
    console.log(`counts - permissions: ${permCount.rows[0].c}, roles: ${roleCount.rows[0].c}`);
    try{
      const usersWithRole = await pool.query("select id, email, role from users where role is not null limit 20");
      console.log('users with role (sample):', usersWithRole.rows);
    }catch(e){console.error('users sample error', e && (e as any).message ? (e as any).message : e)}
  }catch(e){
    console.error('check-admin-tables error', e && (e as any).message ? (e as any).message : e);
  } finally {
    await pool.end();
  }
}

main();
