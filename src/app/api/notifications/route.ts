export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import {
  createNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/notifications.server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    const limitRaw = Number(url.searchParams.get('limit') ?? '');
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 25;
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const notifications = await getNotifications(userId, { limit, unreadOnly });
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('GET /api/notifications', error);
    return NextResponse.json({ error: 'Falha ao carregar notificações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    if (!body?.title) {
      return NextResponse.json({ error: 'title é obrigatório' }, { status: 400 });
    }
    const record = await createNotification(userId, {
      module: body.module,
      title: String(body.title),
      message: body.message,
      severity: body.severity,
      relatedId: body.relatedId,
      meta: body.meta,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('POST /api/notifications', error);
    return NextResponse.json({ error: 'Falha ao criar notificação' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 });
    }
    if (body?.markAll) {
      await markAllNotificationsAsRead(userId);
      return NextResponse.json({ success: true });
    }
    const notificationId = Number(body?.id);
    if (!notificationId || Number.isNaN(notificationId)) {
      return NextResponse.json({ error: 'id válido é obrigatório' }, { status: 400 });
    }
    await markNotificationAsRead(notificationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications', error);
    return NextResponse.json({ error: 'Falha ao atualizar notificações' }, { status: 500 });
  }
}
