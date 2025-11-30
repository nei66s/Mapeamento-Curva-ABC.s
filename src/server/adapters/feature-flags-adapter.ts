import pool from '@/lib/db';

export async function listFlags() {
  const res = await pool.query(
    'select id, key, label, description, module_id as "moduleId", enabled from feature_flags order by key'
  );
  return res.rows;
}

export async function getFlagByKey(key: string) {
  const res = await pool.query(
    'select id, key, label, description, module_id as "moduleId", enabled from feature_flags where key = $1 limit 1',
    [key]
  );
  return res.rows[0] || null;
}

export async function setFlag(key: string, enabled: boolean) {
  const res = await pool.query(
    'update feature_flags set enabled = $2, updated_at = now() where key = $1 returning id, key, label, description, module_id as "moduleId", enabled',
    [key, enabled]
  );
  if (res.rowCount === 0) {
    const ins = await pool.query(
      'insert into feature_flags(key, enabled) values ($1, $2) returning id, key, label, description, module_id as "moduleId", enabled',
      [key, enabled]
    );
    return ins.rows[0];
  }
  return res.rows[0];
}
