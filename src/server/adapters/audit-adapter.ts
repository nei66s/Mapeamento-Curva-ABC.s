import pool from '@/lib/db';

export async function logAudit(entry: { user_id?: string | null; entity: string; entity_id: string; action: string; before_data?: any; after_data?: any; ip?: string; user_agent?: string }) {
  // Some callers pass sentinel strings like 'system' or 'u-admin'. The DB
  // audit_logs.user_id column is a UUID; attempt to coerce to null when the
  // value is not a valid UUID to avoid 22P02 errors.
  const maybeUuid = typeof entry.user_id === 'string' ? entry.user_id.trim() : '';
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(maybeUuid);
  const userIdParam = isUuid ? maybeUuid : null;

  const res = await pool.query(
    `insert into audit_logs(user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8, now()) returning id, user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at`,
    [userIdParam, entry.entity, entry.entity_id, entry.action, entry.before_data || null, entry.after_data || null, entry.ip || null, entry.user_agent || null]
  );
  return res.rows[0];
}

export async function listAudit(limit = 100, offset = 0) {
  const res = await pool.query('select id, user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at from audit_logs order by created_at desc limit $1 offset $2', [limit, offset]);
  return res.rows;
}
