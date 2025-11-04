import pool from './db';

async function main(){
  try{
    const res = await pool.query("UPDATE categories SET image_url = regexp_replace(image_url, '/uploads/avatars/', '/uploads/categories/') WHERE image_url LIKE '%/uploads/avatars/%' RETURNING id, image_url");
    console.log('Updated categories: ', res.rowCount);
    console.table(res.rows);

    const res2 = await pool.query("UPDATE items SET image_url = regexp_replace(image_url, '/uploads/avatars/', '/uploads/categories/') WHERE image_url LIKE '%/uploads/avatars/%' RETURNING id, image_url");
    console.log('Updated items: ', res2.rowCount);
    console.table(res2.rows);

    // Users may have different avatar column name; attempt common variants
    const colRes = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
    const cols = colRes.rows.map((r: any) => r.column_name);
    const avatarCol = cols.includes('avatarUrl') ? '"avatarUrl"' : cols.includes('avatarurl') ? 'avatarurl' : cols.includes('avatar_url') ? 'avatar_url' : null;
    if (avatarCol) {
      const res3 = await pool.query(`UPDATE users SET ${avatarCol} = regexp_replace(${avatarCol}, '/uploads/avatars/', '/uploads/categories/') WHERE ${avatarCol} LIKE '%/uploads/avatars/%' RETURNING id, ${avatarCol}`);
      console.log('Updated users: ', res3.rowCount);
      console.table(res3.rows);
    } else {
      console.log('No avatar column found on users table to update');
    }
  }catch(err){
    console.error(err);
  }finally{
    await pool.end();
  }
}

main();
