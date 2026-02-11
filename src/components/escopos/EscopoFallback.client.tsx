"use client";
import React from 'react';
// Note: Download and Reopen are intentionally omitted from the fallback

export default function EscopoFallback({ id, serverEscopo }: { id: string; serverEscopo?: any | null }) {
  const [escopo, setEscopo] = React.useState<any | null>(serverEscopo || null);

  React.useEffect(() => {
    if (escopo) return;
    try {
      const raw = sessionStorage.getItem('escopo_to_load');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id === id) setEscopo(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, [id, escopo]);

  if (!escopo) {
    return <div className="p-6">Nenhum escopo encontrado.</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Escopo (preenchido do cliente)</h1>
      <div className="space-y-3">
        <div>
          <h2 className="font-semibold">{escopo.title || '—'}</h2>
          <p className="text-sm text-muted-foreground">{escopo.description || '—'}</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm">Solicitante: {escopo.requester || '—'}</p>
          <p className="text-sm">Loja: {escopo.store_id || '—'}</p>
          <p className="text-sm">Criado em: {escopo.created_at ? new Date(escopo.created_at).toLocaleString() : '—'}</p>
        </div>
        {/* Actions are handled from the list view; no download/reopen here */}
      </div>
    </div>
  );
}
