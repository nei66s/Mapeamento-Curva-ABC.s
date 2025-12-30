export type ChatMessage = {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: Record<string, any> | null;
  created_at?: string;
};
import { randomUUID } from 'crypto';
import pool from '../db';

const isUuid = (v?: string | null) => Boolean(v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v));

// Use the project's Postgres pool directly (DATABASE_URL) so the AI chat
// storage works without needing separate Supabase REST keys in env.
async function query(sql: string, params: any[] = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

export async function createConversation(userId: string, opts?: { profileId?: string; title?: string; metadata?: any }) {
  const rows = await query(
    `INSERT INTO ai_conversations(user_id, profile_id, title, metadata) VALUES ($1,$2,$3,$4) RETURNING *`,
    [userId, opts?.profileId ?? null, opts?.title ?? null, opts?.metadata ?? null]
  );
  return rows?.[0] ?? null;
}

export async function insertMessage(conversationId: string, message: ChatMessage) {
  // Ensure deterministic IDs from the caller to avoid duplicates on retries.
  const id = isUuid(message.id) ? message.id! : randomUUID();
  const rows = await query(
    `INSERT INTO ai_messages(id, conversation_id, role, content, meta) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (id) DO NOTHING RETURNING *`,
    [id, conversationId, message.role, message.content, message.meta ?? null]
  );
  return rows?.[0] ?? null;
}

export async function saveConversation(userId: string, messages: ChatMessage[], opts?: { conversationId?: string; profileId?: string; title?: string }) {
  // create conversation if missing
  let conversation = null;
  const candidateConvId = isUuid(opts?.conversationId) ? opts?.conversationId : null;
  if (candidateConvId) {
    const res = await query(`SELECT * FROM ai_conversations WHERE id = $1`, [candidateConvId]);
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
  const conv = await query(`SELECT * FROM ai_conversations WHERE id = $1`, [conversationId]);
  if (!Array.isArray(conv) || conv.length === 0) return null;
  const conversation = conv[0];
  const msgs = await query(`SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY created_at ASC`, [conversationId]);
  return { conversation, messages: msgs };
}

export async function listUserConversations(userId: string, limit = 50) {
  const res = await query(`SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`, [userId, limit]);
  return Array.isArray(res) ? res : [];
}
