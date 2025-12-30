"use client";

import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubbleNew";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

type Props = {
  messages: ChatMessage[];
  loading?: boolean;
  reportLoading?: boolean;
  userAvatar?: string | null;
  assistantAvatar?: string | null;
  endRef?: React.RefObject<HTMLDivElement>;
};

export default function ChatMessages({ messages, loading, reportLoading, userAvatar, assistantAvatar, endRef }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages arrive or loading state changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Smooth scroll to bottom
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, reportLoading]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 h-0 overflow-y-auto overflow-x-hidden bg-[#f9fafb] px-4 pt-4 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
      <div className="flex flex-col gap-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            avatarUrl={m.role === 'user' ? userAvatar : null}
            assistantAvatarUrl={m.role === 'assistant' ? assistantAvatar : null}
          />
        ))}
        {(loading || reportLoading) && <MessageBubble role="assistant" content="digitando..." isLoading />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
