import React from 'react';
import requireAuthOrRedirect from '@/lib/server-auth-guard';
import EscopoFallback from '@/components/escopos/EscopoFallback.client';

export default async function EscopoDetail({ params }: { params: { id: string } }) {
  await requireAuthOrRedirect();
  const { id } = await params;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    // Render a client-side fallback that can read the escopo from sessionStorage
    return <EscopoFallback id={id} />;
  }

  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/escopos?id=eq.${encodeURIComponent(id)}&select=*`;
  const res = await fetch(url, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return <div className="p-6">Erro ao carregar.</div>;
  const arr = await res.json().catch(() => []);
  const escopo = Array.isArray(arr) && arr.length ? arr[0] : null;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Escopo</h1>
      {!escopo ? (
        // If server didn't find escopo, let client fallback component try sessionStorage
        <EscopoFallback id={id} serverEscopo={null} />
      ) : (
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
        </div>
      )}
    </div>
  );
}

function ReopenButton({ escopo }: { escopo: any }) {
  // This is a client-side interactive button that stores the escopo in sessionStorage
  return (
    <div>
      <button
        className="inline-flex items-center rounded bg-primary px-3 py-1 text-white"
        onClick={() => {
          try {
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('escopo_to_load', JSON.stringify(escopo));
              window.location.href = '/escopos';
            }
          } catch (e) {
            // ignore
          }
        }}
      >
        Reabrir no editor
      </button>
    </div>
  );
}

