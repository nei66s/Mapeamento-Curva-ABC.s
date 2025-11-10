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
    console.error('GET /api/settings error', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    const saved = await upsertUserSettings(String(userId), {
      theme: body.theme,
      language: body.language,
      density: body.density,
      defaultPage: body.defaultPage,
      notifications: body.notifications,
    });
    return NextResponse.json(saved);
  } catch (err) {
    console.error('PUT /api/settings error', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

