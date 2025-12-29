"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Shield, Clock, User } from 'lucide-react';

export default function ActivityFeedPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [types, setTypes] = useState<'both'|'audit'|'tracking'>('both');
  const [userFilter, setUserFilter] = useState('');
  const [since, setSince] = useState<number | ''>(60);

  const buildQuery = (p = 0) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', String(limit));
    if (types !== 'both') params.set('types', types);
    if (userFilter) params.set('user', userFilter);
    if (since && Number.isFinite(Number(since))) params.set('sinceMinutes', String(since));
    return `/api/admin/activity?${params.toString()}`;
  };

  const fetchPage = async (p = 0, replace = false) => {
    setLoading(true);
    try {
      const res = await fetch(buildQuery(p), { cache: 'no-store' });
      const json = await res.json();
      setEvents(prev => (replace ? json.events : (p === 0 ? json.events : [...prev, ...json.events])));
      setTotal(json.total ?? null);
      setPage(p);
    } catch (e) {
      console.error('Failed to load activity', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPage(0, true); }, [types, userFilter, since]);

  const handleLoadMore = () => fetchPage(page + 1);

  const renderIcon = (type: string) => {
    if (type === 'tracking') return <Activity className="h-4 w-4 text-muted-foreground" />;
    return <Shield className="h-4 w-4 text-muted-foreground" />;
  };

  const grouped = events.reduce((acc: Record<string, any[]>, ev) => {
    acc[ev.type] = acc[ev.type] || [];
    acc[ev.type].push(ev);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <main className="p-8">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold mb-2">Atividade</h1>
        <p className="text-sm text-muted-foreground mb-6">Linha do tempo com ações recentes (auditoria, acessos, rotas).</p>

        <form
          aria-label="Filtros de atividade"
          className="mb-4 flex flex-wrap items-center gap-3"
          onSubmit={(e) => { e.preventDefault(); fetchPage(0, true); }}
        >
          <label htmlFor="types-select" className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Tipo</span>
            <select id="types-select" aria-label="Tipo de atividade" value={types} onChange={(e) => setTypes(e.target.value as any)} className="ml-2 rounded border surface-control px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/60">
              <option value="both">Todos</option>
              <option value="audit">Auditoria</option>
              <option value="tracking">Rota / Acesso</option>
            </select>
          </label>

          <label htmlFor="user-input" className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input id="user-input" aria-label="ID do usuário" placeholder="ID do usuário (opcional)" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="rounded border surface-control px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/60" />
          </label>

          <label htmlFor="since-select" className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <select id="since-select" aria-label="Desde (minutos)" value={String(since)} onChange={(e) => setSince(e.target.value === '' ? '' : Number(e.target.value))} className="ml-2 rounded border surface-control px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/60">
              <option value="15">Últimos 15 minutos</option>
              <option value="60">Última 1 hora</option>
              <option value="360">Últimas 6 horas</option>
              <option value="1440">Últimas 24 horas</option>
              <option value="10080">Últimos 7 dias</option>
            </select>
          </label>

          <button type="submit" aria-controls="activity-results" className="ml-auto btn-variant-default">Aplicar</button>
        </form>

        <div id="activity-results" className="rounded-lg border border-white/10 surface-highlight p-4" aria-live="polite">
          {events.length === 0 && !loading && <p className="text-sm text-muted-foreground">Sem eventos.</p>}

          {Object.keys(grouped).length === 0 && events.length > 0 && (
            <ul role="list" className="space-y-3">
              {events.map((ev, idx) => (
                  <li role="listitem" key={ev.id} className="rounded-md p-3 surface-card">
                  <article aria-labelledby={`ev-title-${idx}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 id={`ev-title-${idx}`} className="text-sm font-semibold flex items-center gap-2">
                          {renderIcon(ev.type)}
                          <span className="ml-1">{ev.action}</span>
                        </h4>
                        <div className="text-xs text-muted-foreground">{ev.user_id ? `Usuário: ${ev.user_id}` : 'Usuário: anônimo'}</div>
                        <dl className="mt-2 text-xs text-muted-foreground">
                          {ev.metadata && ev.metadata.device && <div><dt className="font-medium">Dispositivo:</dt><dd>{ev.metadata.device}</dd></div>}
                          {ev.metadata && ev.metadata.browser && <div><dt className="font-medium">Navegador:</dt><dd>{ev.metadata.browser}</dd></div>}
                          {ev.type === 'audit' && ev.metadata && ev.metadata.ip && <div><dt className="font-medium">IP:</dt><dd>{ev.metadata.ip}</dd></div>}
                        </dl>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <time dateTime={new Date(ev.created_at).toISOString()}>{new Date(ev.created_at).toLocaleString()}</time>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {Object.entries(grouped).map(([type, items]) => (
            <section key={type} aria-labelledby={`group-${type}`} className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                {type === 'tracking' ? <Activity className="h-5 w-5 text-muted-foreground" aria-hidden="true" /> : <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
                <h3 id={`group-${type}`} className="text-sm font-semibold uppercase text-muted-foreground">{type === 'tracking' ? 'Rota / Acesso' : 'Auditoria'}</h3>
              </div>
              <ul role="list" className="space-y-2">
                {items.map((ev: any, idx: number) => (
                    <li role="listitem" key={ev.id} className="rounded-md p-3 surface-card">
                    <article aria-labelledby={`item-${type}-${idx}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 id={`item-${type}-${idx}`} className="text-sm font-semibold">{ev.action}</h4>
                          <div className="text-xs text-muted-foreground">{ev.user_id ? `Usuário: ${ev.user_id}` : 'Usuário: anônimo'}</div>
                          <dl className="mt-2 text-xs text-muted-foreground">
                            {ev.metadata && ev.metadata.device && <div><dt className="font-medium">Dispositivo:</dt><dd>{ev.metadata.device}</dd></div>}
                            {ev.metadata && ev.metadata.browser && <div><dt className="font-medium">Navegador:</dt><dd>{ev.metadata.browser}</dd></div>}
                            {ev.type === 'audit' && ev.metadata && ev.metadata.ip && <div><dt className="font-medium">IP:</dt><dd>{ev.metadata.ip}</dd></div>}
                          </dl>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <time dateTime={new Date(ev.created_at).toISOString()}>{new Date(ev.created_at).toLocaleString()}</time>
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button className="btn-variant-outline" onClick={handleLoadMore} disabled={loading || (total !== null && events.length >= total)} aria-label="Carregar mais eventos">
            {loading ? 'Carregando...' : 'Carregar mais'}
          </button>
          <Link href="/indicators" className="text-sm font-semibold text-primary hover:underline">Voltar ao Painel</Link>
        </div>
      </div>
    </main>
  );
}
