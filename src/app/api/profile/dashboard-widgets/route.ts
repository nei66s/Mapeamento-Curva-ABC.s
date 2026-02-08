export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { getUserDashboardWidgets, setUserDashboardWidgets } from '@/server/adapters/users-adapter';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.cookies.get('pm_access_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    const verified = verifyAccessToken(token);
    if (!verified.valid) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const widgets = await getUserDashboardWidgets(verified.userId);
    return NextResponse.json({ ok: true, result: widgets ?? {} });
  } catch (err: any) {
    console.error('Error GET /api/profile/dashboard-widgets', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token =
      request.cookies.get('pm_access_token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    const verified = verifyAccessToken(token);
    if (!verified.valid) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
    }

    await setUserDashboardWidgets(verified.userId, body as Record<string, any>);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Error PUT /api/profile/dashboard-widgets', err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
