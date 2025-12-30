"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  avatarUrl?: string | null;
  assistantAvatarUrl?: string | null;
};

export function MessageBubble({ role, content, isLoading = false, avatarUrl, assistantAvatarUrl }: MessageBubbleProps) {
  const router = useRouter();
  const isAssistant = role === "assistant";

  const bubble = (
    <div
      className={cn(
        "max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        isAssistant
          ? "bg-slate-800 text-white border border-white/6"
          : "bg-white text-slate-900 border border-slate-200"
      )}
    >
      {isLoading && isAssistant ? (
        <div className="flex items-center">
          <div className="h-8 w-16 rounded-full bg-slate-700/40 px-3 py-1 flex items-center justify-center">
            <span className="inline-block h-2 w-2 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '0s' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-white/80 ml-2 animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="inline-block h-2 w-2 rounded-full bg-white/80 ml-2 animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : (
        <p className={cn("whitespace-pre-wrap", isLoading && "opacity-60 text-muted-foreground")}>{content}</p>
      )}
    </div>
  );

  const avatar = isAssistant ? assistantAvatarUrl : avatarUrl;

  const avatarNode = (
    <div className="flex-shrink-0 flex flex-col items-center">
      {avatar ? (
        <img src={avatar} alt={isAssistant ? 'Assistente' : 'Usuario'} className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">{isAssistant ? 'IA' : 'TU'}</div>
      )}
      {isAssistant && (
        <div className="text-[11px] mt-1 text-muted-foreground capitalize">zeca</div>
      )}
    </div>
  );

  // detect all internal route patterns like /dashboard/profile
  const matches = Array.from(content.matchAll(/(\/[a-z0-9\-\/]+)(?=\b|\s|$)/ig)).map((m) => m[1]);
  const uniqueRoutes = Array.from(new Set(matches));

  const handleOpenRoute = async (route: string) => {
    try {
      // send analytics event
      try {
        fetch('/api/ai/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'route_click', route, source: 'ai-chat' }),
        }).catch(() => {});
      } catch (e) {}
      router.push(route);
    } catch (e) {
      if (typeof window !== 'undefined') window.location.href = route;
    }
  };

  const actionButtons = uniqueRoutes.length > 0 ? (
    <div className="mt-2 flex flex-wrap gap-2">
      {uniqueRoutes.map((r) => (
        <Button key={r} size="sm" variant="ghost" onClick={() => handleOpenRoute(r)}>
          {r.includes('profile') ? 'Abrir perfil' : `Abrir ${r.replace('/', '')}`}
        </Button>
      ))}
    </div>
  ) : null;

  return (
    <div className={cn("flex w-full flex-col gap-2", isAssistant ? "items-start" : "items-end")}>
      <div className={cn("flex w-full items-end gap-3", isAssistant ? "justify-start" : "justify-end")}>
        {isAssistant ? <>{avatarNode}{bubble}</> : <>{bubble}{avatarNode}</>}
      </div>
      {actionButtons}
    </div>
  );
}
