"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from '@/hooks/use-current-user';
import type { KeyboardEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Send } from 'lucide-react';
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { aiProfiles, getProfileById } from "@/lib/ai/ai-profiles";
import { createMockResponse } from "@/lib/ai/mock-response";
import { MessageBubble } from "./MessageBubble";
import { ProfileSelector } from "./ProfileSelector";
import { ReportButton } from "./ReportButton";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback to a pseudo-uuid format
  const rnd = Math.random().toString(16).slice(2, 10);
  const ts = Date.now().toString(16).padStart(12, '0');
  return `${ts.slice(0, 8)}-${ts.slice(8, 12)}-4${rnd.slice(0,3)}-a${rnd.slice(3,6)}-${rnd.slice(6, 8)}${Math.random().toString(16).slice(2,6)}`;
};

const isUuidClient = (v?: string | null) => Boolean(v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v));

const isExplicitReportRequest = (text: string) =>
  /relatorio|diagnostico estruturado/i.test(text);

type ChatWindowProps = {
  initialProfileId?: string;
  compact?: boolean;
};

type ChatWindowPropsWithBusy = ChatWindowProps & {
  onBusyChange?: (busy: boolean) => void;
};

export function ChatWindow({ initialProfileId, compact = false, onBusyChange }: ChatWindowPropsWithBusy) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [allowServerRestore, setAllowServerRestore] = useState(true);
  const [restoredFromServer, setRestoredFromServer] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const activeProfile = useMemo(
    () => (activeProfileId ? getProfileById(activeProfileId) : undefined),
    [activeProfileId]
  );
  const { user } = useCurrentUser();
  const hasUserMessages = useMemo(() => messages.some((message) => message.role === "user"), [messages]);
  const guestIdKey = 'ai_chat_guest_id';

  // Create or load a stable guestId so we can persist server-side even sem login
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const existing = localStorage.getItem(guestIdKey);
      if (existing) {
        setGuestId(existing);
        return;
      }
      const newId = `guest-${crypto.randomUUID ? crypto.randomUUID() : createId()}`;
      localStorage.setItem(guestIdKey, newId);
      setGuestId(newId);
    } catch (e) {
      // fallback: still set a transient id so server persistence can happen during session
      setGuestId((prev) => prev ?? `guest-${createId()}`);
    }
  }, []);

  // Load last conversation from the API (user or guest) when there is nothing in memory
  useEffect(() => {
    const ownerId = user?.id ?? guestId;
    if (!ownerId) return;
    if (messages.length > 0) return;
    if (!allowServerRestore) return;

    const loadFromServer = async () => {
      try {
        // If we already have conversationId but no messages, fetch by id
        if (conversationId) {
          const res = await fetch(`/api/ai/chat?conversationId=${conversationId}`);
          const body = await res.json().catch(() => null);
          if (body?.ok && Array.isArray(body.result?.messages) && body.result.messages.length > 0) {
            const msgs = body.result.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content }));
            setMessages(msgs);
            setRestoredFromServer(true);
            return;
          }
        }

        // Otherwise fetch the latest conversation for this owner
        const res = await fetch(`/api/ai/chat?userId=${ownerId}&limit=1`);
        const body = await res.json().catch(() => null);
        if (body?.ok && Array.isArray(body.result) && body.result.length > 0) {
          const conv = body.result[0];
          const convId = conv.id;
          const msgs = await fetch(`/api/ai/chat?conversationId=${convId}`).then((r) => r.json()).catch(() => null);
          if (msgs?.ok && Array.isArray(msgs.result?.messages) && msgs.result.messages.length > 0) {
            setConversationId(convId);
            setMessages(msgs.result.messages.map((m: any) => ({ id: m.id, role: m.role, content: m.content })));
            setRestoredFromServer(true);
          }
        }
      } catch (e) {
        console.error('Failed to load conversation from server', e);
      }
    };

    loadFromServer();
  }, [user?.id, guestId, conversationId, messages.length, allowServerRestore]);

  // persist messages/profile and conversationId to guest key and user key (when available) - save immediately
  // no localStorage persistence for messages: we rely on backend

  useEffect(() => {
    if (initialProfileId && !activeProfileId) {
      setActiveProfileId(initialProfileId);
    }
  }, [initialProfileId, activeProfileId]);

  useEffect(() => {
    if (restoredFromServer) return;
    if (activeProfile && messages.length === 0 && !conversationId) {
      setMessages([
        {
          id: createId(),
          role: "assistant",
          content: activeProfile.greeting,
        },
      ]);
    }
  }, [activeProfile?.profileId, conversationId, messages.length, restoredFromServer]);

  // scrolling handled inside ChatMessages (only scroll when user is at bottom)

  // auto-save conversation to server (debounced) when we have an owner (user or guest)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const ownerId = user?.id ?? guestId;
      if (!ownerId) return;
      if (messages.length === 0) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(async () => {
        try {
          const sanitized = messages.map((m) => ({
            id: isUuidClient(m.id) ? m.id : createId(),
            role: m.role,
            content: m.content,
          }));
          const payload = {
            userId: ownerId,
            messages: sanitized,
            conversationId: isUuidClient(conversationId) ? conversationId : undefined,
            profileId: activeProfile?.profileId ?? undefined,
            title: messages.find((m) => m.role === 'user')?.content?.slice(0, 120) ?? undefined,
          };
          const res = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const body = await res.json().catch(() => null);
          if (body && body.ok && body.result && body.result.conversation && body.result.conversation.id) {
            setConversationId(body.result.conversation.id);
          }
        } catch (e) {
          console.error('Failed to persist chat', e);
        }
      }, 1200) as unknown as number;
    } catch (e) {
      // ignore
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [messages, user?.id, guestId, conversationId, activeProfile?.profileId]);

  const sendMessage = async (mode: "chat" | "report" = "chat") => {
    const trimmed = input.trim();
    if (!trimmed || loading || reportLoading || !activeProfile) return;

    // Once user starts a new message, allow future restores
    setAllowServerRestore(true);
    setRestoredFromServer(false);

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      onBusyChange?.(true);
    } catch (e) {}

    try {
      // Prefer server AI endpoint (which uses Genkit/GenAI) if available
      const appContext = {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        routes: ['/', '/ai-chat', '/ai-assistant', '/ai-insights', '/dashboard', '/assets', '/categories', '/admin-panel'],
        name: 'Aplicacao',
      };

      const userContext = user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl ?? undefined,
            profileEditRoute: '/dashboard/profile',
          }
        : undefined;

      const payload = { profileId: activeProfile?.profileId, messages: [...messages, userMessage], mode, appContext, userContext };
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json()).catch(() => ({ ok: false }));

      const text = res?.ok ? res.result : (await createMockResponse(activeProfile, [...messages, userMessage], mode)).text;
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: text,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
      try {
        onBusyChange?.(false);
      } catch (e) {}
    }
  };

  const handleReport = async () => {
    if (!activeProfile || loading || reportLoading || !hasUserMessages) return;
    setReportLoading(true);
    try {
      onBusyChange?.(true);
    } catch (e) {}
    try {
      const appContext = {
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        routes: ['/', '/ai-chat', '/ai-assistant', '/ai-insights', '/dashboard', '/assets', '/categories', '/admin-panel'],
        name: 'Aplicacao',
      };

      const userContext = user
        ? {
            id: user.id,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl ?? undefined,
            profileEditRoute: '/dashboard/profile',
          }
        : undefined;

      const payload = { profileId: activeProfile?.profileId, messages, mode: 'report', appContext, userContext };
      const res = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }).then(r => r.json()).catch(() => ({ ok: false }));
      const text = res?.ok ? res.result : (await createMockResponse(activeProfile, messages, 'report')).text;
      const assistantMessage: ChatMessage = { id: createId(), role: 'assistant', content: text };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setReportLoading(false);
      try {
        onBusyChange?.(false);
      } catch (e) {}
    }
  };

  const onKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const mode = isExplicitReportRequest(input) ? "report" : "chat";
      sendMessage(mode);
    }
  };

  const handleProfileChange = (value: string) => {
    if (activeProfileId) return;
    setActiveProfileId(value);
  };

  const clearChat = () => {
    setMessages([]);
    setAllowServerRestore(false);
    setRestoredFromServer(false);
    try {
      setConversationId(null);
    } catch (e) {}
  };

  // Compact (floating) layout similar to WhatsApp
  if (compact) {
    return (
      <div className="flex flex-col overflow-hidden h-full">
        <div
          className="rounded-2xl bg-white border border-gray-200 flex flex-col overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)', width: 360, height: '100%' }}
        >
          <ChatHeader name="Zeca" status={activeProfile ? 'online' : 'offline'} avatarUrl={'/ai-avatar.png'} onNewChat={clearChat} onHistory={() => {}} />
          <ChatMessages
            messages={messages}
            loading={loading}
            reportLoading={reportLoading}
            userAvatar={user?.avatarUrl ?? null}
            assistantAvatar={'/ai-avatar.png'}
            endRef={endRef}
          />
          <div className="flex-shrink-0 p-2">
            <div className="flex items-center gap-2">
              <ChatInput
                value={input}
                onChange={(v) => setInput(v)}
                onKeyDown={onKeyDown}
                onSend={() => sendMessage(isExplicitReportRequest(input) ? "report" : "chat")}
                disabled={!activeProfileId || loading || reportLoading}
                loading={loading}
              />
              <Button size="sm" variant="ghost" onClick={clearChat} aria-label="Limpar conversa">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 overflow-hidden">
      <div
        className="bg-white border border-gray-200 rounded-[14px] w-full max-w-[480px] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)', height: '600px' }}
      >
        <ChatHeader name="Zeca" status={activeProfile ? 'online' : 'offline'} avatarUrl={'/ai-avatar.png'} onNewChat={clearChat} onHistory={() => {}} />
        <ChatMessages
          messages={messages}
          loading={loading}
          reportLoading={reportLoading}
          userAvatar={user?.avatarUrl ?? null}
          assistantAvatar={'/ai-avatar.png'}
          endRef={endRef}
        />
        <div className="flex-shrink-0 px-3 py-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">{activeProfile ? activeProfile.description : 'Assistente de IA'}</div>
            <div className="flex items-center gap-2">
              <ProfileSelector
                profiles={aiProfiles}
                value={activeProfileId ?? undefined}
                onChange={handleProfileChange}
                disabled={Boolean(activeProfileId)}
              />
              <Button size="sm" variant="ghost" onClick={clearChat}>Limpar</Button>
            </div>
          </div>
          <ChatInput
            value={input}
            onChange={(v) => setInput(v)}
            onKeyDown={onKeyDown}
            onSend={() => sendMessage(isExplicitReportRequest(input) ? "report" : "chat")}
            disabled={!activeProfileId || loading || reportLoading}
            loading={loading}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">Converse normalmente. Gere relatorio tecnico apenas se precisar.</p>
            <div className="flex items-center gap-2">
              <ReportButton
                onClick={handleReport}
                disabled={!activeProfileId || !hasUserMessages || loading || reportLoading}
                loading={reportLoading}
              />
              <Button size="sm" variant="ghost" onClick={clearChat} aria-label="Limpar conversa">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
