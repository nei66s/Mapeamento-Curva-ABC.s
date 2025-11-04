import pool from './db';

async function main(){
  try{
    console.log('Users with avatar like /uploads/avatars:');
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
    const cols = colRes.rows.map((r: any) => r.column_name);
    const avatarCol = cols.includes('avatarUrl') ? '"avatarUrl"' : cols.includes('avatarurl') ? 'avatarurl' : cols.includes('avatar_url') ? 'avatar_url' : null;
    if (avatarCol) {
      const u = await pool.query(`SELECT id, ${avatarCol} as avatar FROM users WHERE ${avatarCol} LIKE '%/uploads/avatars/%'`);
      console.table(u.rows);
    } else {
      console.log('No avatar-like column found on users table');
    }

    console.log('Categories with image_url like /uploads/avatars:');
    const c = await pool.query("SELECT id, image_url FROM categories WHERE image_url LIKE '%/uploads/avatars/%'");
    console.table(c.rows);

    console.log('Items with image_url like /uploads/avatars:');
    const i = await pool.query("SELECT id, image_url FROM items WHERE image_url LIKE '%/uploads/avatars/%'");
    console.table(i.rows);
  }catch(err){
    console.error(err);
  }finally{
    await pool.end();
  }
}

main();
