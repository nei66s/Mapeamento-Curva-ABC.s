import { getUserById } from '@/server/adapters/users-adapter';
import type { NotificationPayload } from '@/lib/types';

type WhatsAppConfig = {
  endpoint: string;
  token?: string;
  sender?: string;
};

type WhatsAppMessage = {
  to: string;
  text: string;
  meta?: Record<string, any>;
};

function coerceFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return false;
}

function getWhatsAppConfig(): WhatsAppConfig | null {
  const endpoint = process.env.WHATSAPP_API_URL?.trim();
  if (!endpoint) return null;
  const token = process.env.WHATSAPP_API_TOKEN?.trim();
  const sender =
    process.env.WHATSAPP_FROM?.trim() ||
    process.env.WHATSAPP_SENDER?.trim() ||
    undefined;
  return { endpoint, token, sender };
}

export async function sendWhatsAppMessage(message: WhatsAppMessage) {
  const config = getWhatsAppConfig();
  if (!config) {
    return null;
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const payload: Record<string, any> = {
    to: message.to,
    text: message.text,
  };
  if (config.sender) {
    payload.from = config.sender;
  }
  if (message.meta) {
    payload.meta = message.meta;
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => null);
      console.error('WhatsApp API returned an error', {
        status: response.status,
        detail,
        to: message.to,
      });
    }
    return response;
  } catch (error) {
    console.error('Failed to send WhatsApp message', error);
    throw error;
  }
}

export async function sendWhatsAppNotificationIfEligible(userId: string, payload: NotificationPayload) {
  try {
    const user = await getUserById(userId);
    if (!user) return;
    const profile = user.profile ?? {};
    const phone = typeof profile.phone === 'string' ? profile.phone.trim() : '';
    if (!phone) return;
    if (!coerceFlag(profile.has_whatsapp) || !coerceFlag(profile.whatsapp_notifications)) return;
    const parts = [payload.title, payload.message].filter(Boolean);
    if (!parts.length) return;
    const text = parts.join('\n\n');
    const extraMeta = {
      module: payload.module ?? undefined,
      severity: payload.severity ?? undefined,
      relatedId: payload.relatedId ?? undefined,
      ...payload.meta,
    };
    await sendWhatsAppMessage({
      to: phone,
      text,
      meta: extraMeta,
    });
  } catch (error) {
    console.error('Failed to deliver WhatsApp notification', error);
  }
}
