export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../../_utils';
import pool from '@/lib/db';
import { logAudit } from '@/server/adapters/audit-adapter';
import { getModuleByKey } from '@/server/adapters/modules-adapter';

const CONFIG_KEY = 'system_config';

export async function POST(request: NextRequest) {
  const mod = await getModuleByKey('admin-config');
  if (mod && !mod.is_active) return json({ message: 'Módulo de config inativo.' }, 403);
  const body = await request.json();
  try {
    const sel = await pool.query('select value from admin_dashboard_settings where key = $1 limit 1', [CONFIG_KEY]);
    const before = sel.rowCount ? (sel.rows[0].value?.monitoring || null) : null;
    const updatedFull = Object.assign({}, sel.rowCount ? sel.rows[0].value || {} : {}, { monitoring: body.monitoring || before });
    await pool.query("insert into admin_dashboard_settings(key, value) values ($1, $2::jsonb) on conflict (key) do update set value = $2::jsonb, updated_at = now()", [CONFIG_KEY, JSON.stringify(updatedFull)]);
    try { await logAudit({ user_id: body.actorId || 'u-admin', entity: 'config', entity_id: 'monitoring', action: 'config.monitoring.update', before_data: before, after_data: updatedFull.monitoring, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined }); } catch (e) {}
    return json(updatedFull);
  } catch (e) {
    return json({ message: 'Erro ao atualizar monitoramento' }, 500);
  }
}
