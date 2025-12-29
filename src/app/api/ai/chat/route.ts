export const runtime = 'nodejs';

import { NextResponse, type NextRequest } from 'next/server';
import { saveConversation, loadConversation, listUserConversations } from '@/lib/ai/chat.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body?.userId;
    const messages = body?.messages;
    if (!userId) return NextResponse.json({ ok: false, error: 'userId é obrigatório' }, { status: 400 });
    if (!Array.isArray(messages) || messages.length === 0) return NextResponse.json({ ok: false, error: 'messages é obrigatório' }, { status: 400 });

    const result = await saveConversation(userId, messages, { conversationId: body.conversationId, profileId: body.profileId, title: body.title });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('POST /api/ai/chat', error);
    return NextResponse.json({ ok: false, error: 'Falha ao salvar conversa' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const userId = url.searchParams.get('userId');

    if (conversationId) {
      const conv = await loadConversation(conversationId);
      return NextResponse.json({ ok: true, result: conv });
    }

    if (userId) {
      const list = await listUserConversations(userId, Number(url.searchParams.get('limit') ?? 25));
      return NextResponse.json({ ok: true, result: list });
    }

    return NextResponse.json({ ok: false, error: 'conversationId ou userId é obrigatório' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/ai/chat', error);
    return NextResponse.json({ ok: false, error: 'Falha ao carregar conversa' }, { status: 500 });
  }
}
