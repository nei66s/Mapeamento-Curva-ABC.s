import pool from '@/lib/db';

async function permissionKeyColumn() {
  const res = await pool.query(
    "select column_name from information_schema.columns where table_name='permissions' and column_name in ('key','name') limit 1"
  );
  return (res.rows[0] && res.rows[0].column_name) || 'name';
}

export async function listPermissions() {
  const keyCol = await permissionKeyColumn();
  const q = `select id, ${keyCol} as key from permissions order by ${keyCol}`;
  const res = await pool.query(q);
  return res.rows;
}

export async function getPermissionByKey(key: string) {
  const keyCol = await permissionKeyColumn();
  const q = `select id, ${keyCol} as key from permissions where ${keyCol} = $1 limit 1`;
  const res = await pool.query(q, [key]);
  return res.rows[0] || null;
}
