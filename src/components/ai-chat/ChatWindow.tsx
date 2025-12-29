"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentUser } from '@/hooks/use-current-user';
import type { KeyboardEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  const endRef = useRef<HTMLDivElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const activeProfile = useMemo(
    () => (activeProfileId ? getProfileById(activeProfileId) : undefined),
    [activeProfileId]
  );
  const { user } = useCurrentUser();
  const hasUserMessages = useMemo(() => messages.some((message) => message.role === "user"), [messages]);
  const storageKey = typeof window !== 'undefined' && user ? `ai_chat_${user.id}` : 'ai_chat_guest';

  // load persisted messages/profile when storageKey changes (e.g. user becomes available)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      // do not overwrite an active conversation
      if (messages.length > 0) return;
      const raw = localStorage.getItem(storageKey as string);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (parsed.activeProfileId) setActiveProfileId(parsed.activeProfileId);
        if (parsed.conversationId) setConversationId(parsed.conversationId);
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // persist messages/profile and conversationId
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const payload = { messages, activeProfileId, conversationId };
      localStorage.setItem(storageKey as string, JSON.stringify(payload));
    } catch (e) {}
  }, [messages, activeProfileId, conversationId, storageKey]);

  useEffect(() => {
    if (initialProfileId && !activeProfileId) {
      setActiveProfileId(initialProfileId);
    }
  }, [initialProfileId, activeProfileId]);

  useEffect(() => {
    if (activeProfile && messages.length === 0) {
      setMessages([
        {
          id: createId(),
          role: "assistant",
          content: activeProfile.greeting,
        },
      ]);
    }
  }, [activeProfile, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, reportLoading]);

  // auto-save conversation to server (debounced) when user is logged
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      if (!user?.id) return;
      if (messages.length === 0) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(async () => {
        try {
          const payload = {
            userId: user.id,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            conversationId: conversationId ?? undefined,
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
  }, [messages, user?.id, conversationId, activeProfile?.profileId]);

  const sendMessage = async (mode: "chat" | "report" = "chat") => {
    const trimmed = input.trim();
    if (!trimmed || loading || reportLoading || !activeProfile) return;

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
    try {
      if (typeof window !== 'undefined') localStorage.removeItem(storageKey as string);
      setConversationId(null);
    } catch (e) {}
  };

  // Compact (floating) layout similar to WhatsApp: header, scroll area, sticky input
  if (compact) {
    return (
      <div className="bg-popover rounded-2xl shadow-lg overflow-hidden transform transition-all duration-200">
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <img src="/ai-avatar.svg" alt="Zeca" className="h-8 w-8 rounded-full object-cover" />
            <div className="text-sm font-medium">Zeca</div>
          </div>
          <div className="text-xs text-primary-foreground/80">{activeProfile ? activeProfile.description : ''}</div>
          <div className="ml-2 flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={clearChat} aria-label="Limpar conversa">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="h-72 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 space-y-3">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    avatarUrl={message.role === 'user' ? user?.avatarUrl ?? null : null}
                    assistantAvatarUrl={message.role === 'assistant' ? '/ai-avatar.svg' : null}
                  />
                ))}
              {(loading || reportLoading) && (
                <MessageBubble role="assistant" content="digitando..." isLoading />
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>
        </div>
        <div className="p-2 bg-surface">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Digite uma mensagem..."
              rows={1}
              className="resize-none h-10"
              disabled={!activeProfileId || loading || reportLoading}
            />
            <div className="flex items-center gap-2">
              <Button
                onClick={() => sendMessage(isExplicitReportRequest(input) ? "report" : "chat")}
                disabled={!activeProfileId || loading || reportLoading || !input.trim()}
                className="h-10"
              >
                {loading ? "..." : "Enviar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Perfil:</span>
            <Badge variant="outline">{activeProfile?.label ?? "Selecione um perfil"}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            O perfil e escolhido uma unica vez e define o tom da conversa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ProfileSelector
          profiles={aiProfiles}
          value={activeProfileId ?? undefined}
          onChange={handleProfileChange}
          disabled={Boolean(activeProfileId)}
          />
          <Button size="sm" variant="ghost" onClick={clearChat}>Limpar</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="surface-muted p-4">
          <ScrollArea className="h-80 md:h-96">
            <div className="space-y-4">
              {!activeProfileId && (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
                  Selecione um perfil para iniciar a conversa.
                </div>
              )}
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  avatarUrl={message.role === 'user' ? user?.avatarUrl ?? null : null}
                  assistantAvatarUrl={message.role === 'assistant' ? '/ai-avatar.svg' : null}
                />
              ))}
              {(loading || reportLoading) && (
                <MessageBubble role="assistant" content="digitando..." isLoading />
              )}
              <div ref={endRef} />
            </div>
          </ScrollArea>
        </div>
        <div className="space-y-3">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Descreva o problema como se estivesse falando com um colega de campo..."
            rows={3}
            disabled={!activeProfileId || loading || reportLoading}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Converse normalmente. Gere relatorio tecnico apenas se precisar.
            </p>
            <div className="flex items-center gap-2">
              <ReportButton
                onClick={handleReport}
                disabled={!activeProfileId || !hasUserMessages || loading || reportLoading}
                loading={reportLoading}
              />
              <Button
                onClick={() => sendMessage(isExplicitReportRequest(input) ? "report" : "chat")}
                disabled={!activeProfileId || loading || reportLoading || !input.trim()}
              >
                {loading ? "Enviando..." : "Enviar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={clearChat} aria-label="Limpar conversa">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
