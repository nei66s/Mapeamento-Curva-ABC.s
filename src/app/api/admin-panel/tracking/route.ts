import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../_utils';
import { insertTrackingEvent } from '@/server/adapters/tracking-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';
import { getModuleByKey } from '@/server/adapters/modules-adapter';

export async function POST(request: NextRequest) {
  const mod = await getModuleByKey('admin-analytics');
  if (mod && !mod.is_active) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const body = await request.json();
  if (body.type === 'pageview') {
    try {
      await insertTrackingEvent({ user_id: body.userId || null, route: body.route || '/', device: body.device || null, browser: body.browser || null });
    } catch (e) {
      return json({ message: 'Erro ao gravar pageview' }, 500);
    }
    return json({ success: true });
  }
  try {
    await logAudit({ user_id: body.userId || 'u-admin', entity: 'action', entity_id: body.name || 'event', action: body.name || 'custom.event', before_data: null, after_data: body.payload || {}, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {}

  return json({ success: true });
}
