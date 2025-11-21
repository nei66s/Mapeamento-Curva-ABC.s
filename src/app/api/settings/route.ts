import { NextResponse } from 'next/server';
import { getUserSettings, upsertUserSettings } from '@/lib/settings.server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const set = await getUserSettings(userId);
    return NextResponse.json(set || {});
  } catch (err) {
    try { console.error('GET /api/settings error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to load settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const saved = await upsertUserSettings(String(userId), {
      theme: body.theme,
      themeColor: body.themeColor,
      themeTone: body.themeTone,
      language: body.language,
      density: body.density,
      defaultPage: body.defaultPage,
      notifications: body.notifications,
    });
    return NextResponse.json(saved);
  } catch (err) {
    try { console.error('PUT /api/settings error', err); } catch(_) {}
    const msg = (err as any)?.message || 'Failed to save settings';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

