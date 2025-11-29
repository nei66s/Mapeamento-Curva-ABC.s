import { NextRequest } from 'next/server';
import { featureFlags, recordAudit } from '../../_data';
import { json, getRequestIp } from '../../_utils';

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const flag = featureFlags.find((f) => f.key === params.key);
  if (!flag) return json({ message: 'Flag não encontrada.' }, 404);
  return json({ ok: true, result: flag });
}

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const body = await request.json();
  const flag = featureFlags.find((f) => f.key === params.key);
  if (!flag) return json({ message: 'Flag não encontrada.' }, 404);
  const updated = { ...flag, enabled: Boolean(body.enabled) };
  featureFlags[featureFlags.findIndex((f) => f.key === params.key)] = updated;

  recordAudit({
    userId: body.actorId || 'u-admin',
    userName: body.actorName || 'Sistema',
    entity: 'flag',
    entityId: params.key,
    action: 'flag.toggle',
    before: flag,
    after: updated,
    ip: getRequestIp(request),
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return json(updated);
}
