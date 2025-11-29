import { NextRequest } from 'next/server';
import { recordAudit, recordPageview } from '../_data';
import { isModuleActive, json } from '../_utils';
import { getRequestIp } from '../_utils';

export async function POST(request: NextRequest) {
  if (!isModuleActive('admin-analytics')) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const body = await request.json();
  if (body.type === 'pageview') {
    recordPageview({
      route: body.route || '/',
      userId: body.userId,
      device: body.device,
      browser: body.browser,
      city: body.city,
      country: body.country,
      sessionId: body.sessionId,
    });
    return json({ success: true });
  }

  recordAudit({
    userId: body.userId || 'u-admin',
    userName: body.userName || 'Sistema',
    entity: 'action',
    entityId: body.name || 'event',
    action: body.name || 'custom.event',
    before: null,
    after: body.payload || {},
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json({ success: true });
}
