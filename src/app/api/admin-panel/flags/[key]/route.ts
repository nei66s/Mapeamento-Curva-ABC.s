export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { json, getRequestIp } from '../../_utils';
import { getFlagByKey, setFlag } from '@/server/adapters/feature-flags-adapter';
import { logAudit } from '@/server/adapters/audit-adapter';

export async function GET(request: NextRequest, context: { params: any }) {
  const { key } = await context.params as { key: string };
  const flag = await getFlagByKey(key);
  if (!flag) return json({ message: 'Flag não encontrada.' }, 404);
  return json({ ok: true, result: flag });
}

export async function POST(request: NextRequest, context: { params: any }) {
  const { key } = await context.params as { key: string };
  const body = await request.json();
  const existing = await getFlagByKey(key);
  if (!existing) return json({ message: 'Flag não encontrada.' }, 404);
  const updated = await setFlag(key, Boolean(body.enabled));

  try {
    await logAudit({ user_id: body.actorId || 'u-admin', entity: 'flag', entity_id: key, action: 'flag.toggle', before_data: existing, after_data: updated, ip: getRequestIp(request), user_agent: request.headers.get('user-agent') ?? undefined });
  } catch (e) {}

  return json(updated);
}
