 "use client";

import { useEffect, useState } from "react";

type AiStatus = "checking" | "ready" | "unavailable" | "error";

const STATUS_META: Record<AiStatus, { label: string; className: string; description: string }> = {
  checking: {
    label: "IA...",
    className: "bg-amber-400 animate-pulse",
    description: "Verificando disponibilidade da IA",
  },
  ready: {
    label: "IA ativa",
    className: "bg-emerald-500",
    description: "Integração com a IA disponível",
  },
  unavailable: {
    label: "IA off",
    className: "bg-rose-500",
    description: "Chave/configuração da IA não encontrada",
  },
  error: {
    label: "Erro IA",
    className: "bg-amber-500",
    description: "Falha ao consultar o status da IA",
  },
};

export function AiConnectionIndicator() {
  const [status, setStatus] = useState<AiStatus>('checking')

  useEffect(() => {
    let isMounted = true;

    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((payload) => {
        if (!isMounted) return;
        if (payload?.ok && payload.available) {
          setStatus("ready");
        } else {
          setStatus("unavailable");
        }
      })
      .catch(() => {
        if (isMounted) {
          setStatus("error");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const meta = STATUS_META[status];

  return (
    <div
      className="flex items-center gap-1 text-[0.65rem] uppercase tracking-wider text-muted-foreground"
      title={meta.description}
      aria-live="polite"
    >
      <span aria-hidden className={`h-2 w-2 rounded-full border border-border ${meta.className}`} />
      <span>{meta.label}</span>
    </div>
  );
}
