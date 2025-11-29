import { NextRequest } from 'next/server';
import { isModuleActive, json, getRequestIp } from '../../admin-panel/_utils';
import pool from '@/lib/db';
import { logAudit } from '@/server/adapters/audit-adapter';

export async function POST(request: NextRequest) {
  if (!(await isModuleActive('admin-config'))) return json({ message: 'Módulo de config inativo.' }, 403);
  const body = await request.json();
  try {
    const sel = await pool.query("select value from admin_dashboard_settings where key = $1 limit 1", ['system_config']);
    const before = sel.rowCount ? sel.rows[0].value : null;
    const updated = Object.assign({}, before || {}, { security: body.security || (before && before.security) || {} });
    await pool.query("insert into admin_dashboard_settings(key, value) values ($1, $2::jsonb) on conflict (key) do update set value = $2::jsonb, updated_at = now()", ['system_config', JSON.stringify(updated)]);
    try { await logAudit({ user_id: body.actorId || 'u-admin', entity: 'config', entity_id: 'security', action: 'config.security.update', before_data: before, after_data: updated.security, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') || null }); } catch (e) {}
    return json(updated);
  } catch (e) {
    return json({ message: 'Erro ao atualizar segurança' }, 500);
  }
}
