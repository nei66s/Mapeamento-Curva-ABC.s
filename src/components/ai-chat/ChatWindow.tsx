"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEventHandler } from "react";
import { Button } from "@/components/ui/button";
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

export function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeProfile = useMemo(
    () => (activeProfileId ? getProfileById(activeProfileId) : undefined),
    [activeProfileId]
  );
  const hasUserMessages = useMemo(() => messages.some((message) => message.role === "user"), [messages]);

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
      const { text } = await createMockResponse(activeProfile, [...messages, userMessage], mode);
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: text,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!activeProfile || loading || reportLoading || !hasUserMessages) return;
    setReportLoading(true);
    try {
      const { text } = await createMockResponse(activeProfile, messages, "report");
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: text,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setReportLoading(false);
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
        <ProfileSelector
          profiles={aiProfiles}
          value={activeProfileId ?? undefined}
          onChange={handleProfileChange}
          disabled={Boolean(activeProfileId)}
        />
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
                <MessageBubble key={message.id} role={message.role} content={message.content} />
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
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
