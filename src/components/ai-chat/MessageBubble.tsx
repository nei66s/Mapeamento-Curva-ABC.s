import { cn } from "@/lib/utils";

type MessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
};

export function MessageBubble({ role, content, isLoading = false }: MessageBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div className={cn("flex w-full", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-2xl rounded-2xl border px-4 py-3 text-sm leading-relaxed",
          isAssistant ? "bg-muted/40 text-foreground" : "border-primary/20 bg-primary/10 text-foreground"
        )}
      >
        <p className={cn("whitespace-pre-wrap", isLoading && "animate-pulse text-muted-foreground")}>
          {content}
        </p>
      </div>
    </div>
  );
}
