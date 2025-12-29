export type ChatMessage = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: Record<string, any> | null;
  created_at?: string;
};

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  return { url: url.replace(/\/$/, ''), key };
};

async function supabaseRest(path: string, opts: { method?: string; body?: any; params?: Record<string, string> } = {}) {
  const { url, key } = getSupabaseConfig();
  const u = new URL(`${url}/rest/v1/${path}`);
  if (opts.params) {
    Object.entries(opts.params).forEach(([k, v]) => u.searchParams.set(k, v));
  }
  const res = await fetch(u.toString(), {
    method: opts.method ?? 'GET',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function createConversation(userId: string, opts?: { profileId?: string; title?: string; metadata?: any }) {
  const body = [{ user_id: userId, profile_id: opts?.profileId ?? null, title: opts?.title ?? null, metadata: opts?.metadata ?? null }];
  const rows = await supabaseRest('ai_conversations', { method: 'POST', body });
  return rows?.[0] ?? null;
}

export async function insertMessage(conversationId: string, message: ChatMessage) {
  const body = [{ conversation_id: conversationId, role: message.role, content: message.content, meta: message.meta ?? null }];
  const rows = await supabaseRest('ai_messages', { method: 'POST', body });
  return rows?.[0] ?? null;
}

export async function saveConversation(userId: string, messages: ChatMessage[], opts?: { conversationId?: string; profileId?: string; title?: string }) {
  // create conversation if missing
  let conversation = null;
  if (opts?.conversationId) {
    const res = await supabaseRest('ai_conversations', { params: { select: '*', id: `eq.${opts.conversationId}` } });
    conversation = res?.[0] ?? null;
  }
  if (!conversation) {
    conversation = await createConversation(userId, { profileId: opts?.profileId, title: opts?.title });
  }

  const inserted: any[] = [];
  for (const m of messages) {
    const row = await insertMessage(conversation.id, m);
    inserted.push(row);
  }
  return { conversation, messages: inserted };
}

export async function loadConversation(conversationId: string) {
  const conv = await supabaseRest('ai_conversations', { params: { select: '*', id: `eq.${conversationId}` } });
  if (!Array.isArray(conv) || conv.length === 0) return null;
  const conversation = conv[0];
  const msgs = await supabaseRest('ai_messages', { params: { select: '*', conversation_id: `eq.${conversationId}`, order: 'created_at.asc' } });
  return { conversation, messages: msgs };
}

export async function listUserConversations(userId: string, limit = 50) {
  const res = await supabaseRest('ai_conversations', { params: { select: '*', user_id: `eq.${userId}`, order: 'updated_at.desc', limit: String(limit) } });
  return Array.isArray(res) ? res : [];
}
