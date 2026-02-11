"use client";
import React from 'react';
import ElapsedSince from './ElapsedSince.client';
import ReopenButton from './ReopenButton.client';
import EscopoLink from './EscopoLink.client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrentUser } from '@/hooks/use-current-user';

type Escopo = Record<string, any>;

function exportCsv(rows: Escopo[], fileName = 'escopos.csv') {
  if (!rows || !rows.length) return;
  const keys = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>())
  );
  const csv = [keys.join(',')].concat(rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function GestaoEscoposList({ initialData }: { initialData: Escopo[] }) {
  const [data, setData] = React.useState<Escopo[]>(() => initialData || []);
  

  // Keep component in sync when `initialData` prop changes (e.g. fetched after mount)
  React.useEffect(() => {
    if (!initialData || !initialData.length) return;
    setData((prev) => {
      const existing = new Set((prev || []).map((p) => String(p.id)));
      // prepend new items from initialData that aren't already present
      const toAdd = initialData.filter((it) => !existing.has(String(it.id)));
      if (!toAdd.length) return prev;
      return [...toAdd, ...(prev || [])];
    });
  }, [initialData]);
  const [query, setQuery] = React.useState('');
  // use a non-empty sentinel for the "all" option to satisfy Select.Item requirements
  const ALL_SENTINEL = '__all__';
  const [filterStore, setFilterStore] = React.useState(ALL_SENTINEL);
  const [filterRequester, setFilterRequester] = React.useState(ALL_SENTINEL);
  const [page, setPage] = React.useState(1);
  const perPage = 20;
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [preview, setPreview] = React.useState<Escopo | null>(null);
  const { user } = useCurrentUser();
  const [notifLoading, setNotifLoading] = React.useState<Record<string, boolean>>({});
  const [notifyOpen, setNotifyOpen] = React.useState<Record<string, boolean>>({});
  const [notifyOption, setNotifyOption] = React.useState<Record<string, string>>({});

  const stores = React.useMemo(() => Array.from(new Set(data.map((d) => d.store_id).filter(Boolean))), [data]);
  const requesters = React.useMemo(() => Array.from(new Set(data.map((d) => d.requester).filter(Boolean))), [data]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((d) => {
      if (filterStore && filterStore !== ALL_SENTINEL && String(d.store_id) !== filterStore) return false;
      if (filterRequester && filterRequester !== ALL_SENTINEL && String(d.requester) !== filterRequester) return false;
      if (!q) return true;
      return (
        String(d.title || '').toLowerCase().includes(q) ||
        String(d.description || '').toLowerCase().includes(q) ||
        String(d.requester || '').toLowerCase().includes(q) ||
        String(d.store_id || '').toLowerCase().includes(q)
      );
    });
  }, [data, query, filterStore, filterRequester]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  const current = React.useMemo(() => filtered.slice((page - 1) * perPage, page * perPage), [filtered, page]);

  function toggleSelect(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function selectAllVisible() {
    const next: Record<string, boolean> = {};
    current.forEach((r) => (next[r.id] = true));
    setSelected((s) => ({ ...s, ...next }));
  }

  function clearSelection() {
    setSelected({});
  }

  function exportSelected() {
    const rows = data.filter((r) => selected[r.id]);
    if (!rows.length) return alert('Nenhum item selecionado');
    exportCsv(rows, `escopos-${Date.now()}.csv`);
  }

  async function createNotificationFor(escopo: Escopo, option: string = 'immediate') {
    if (!user) return alert('Autentique-se para criar notificações');
    try {
      setNotifLoading((s) => ({ ...s, [escopo.id]: true }));
      // compute notify_at based on selected option
      const now = Date.now();
      const optionMap: Record<string, number> = {
        immediate: 0,
        in_1h: 1000 * 60 * 60,
        in_4h: 1000 * 60 * 60 * 4,
        in_24h: 1000 * 60 * 60 * 24,
        in_7d: 1000 * 60 * 60 * 24 * 7,
      };
      const delay = optionMap[option] ?? 0;
      const notifyAt = new Date(now + delay).toISOString();

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          module: 'escopos',
          title: `Acompanhar escopo: ${escopo.title || escopo.id}`,
          message: `Você solicitou acompanhar o escopo ${escopo.title || escopo.id}`,
          relatedId: escopo.id,
          severity: 'info',
          notify_at: notifyAt,
        }),
      });
      if (!res.ok) throw new Error('Falha ao criar notificação');
      alert('Notificação criada — você receberá avisos.');
    } catch (err) {
      console.error('createNotificationFor', err);
      alert('Erro ao criar notificação');
    } finally {
      setNotifLoading((s) => ({ ...s, [escopo.id]: false }));
    }
  }

  function refresh() {
    // Simple client-side refresh: reload the page data from server-rendered endpoint
    // We'll attempt to fetch the same route that served this page to get JSON via a custom query
    fetch(window.location.href, { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json)) setData(json);
      })
      .catch(() => {
        // fallback: no-op
      });
  }

  return (
    <div className="p-4">
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por título, solicitante, loja..." />
          <Select value={filterStore} onValueChange={(v) => setFilterStore(v)}>
            <SelectTrigger className="w-48">
                <SelectValue>{filterStore !== ALL_SENTINEL ? filterStore : 'Todas as lojas'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>Todas as lojas</SelectItem>
              {stores.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
            <Select value={filterRequester} onValueChange={(v) => setFilterRequester(v)}>
              <SelectTrigger className="w-48">
                <SelectValue>{filterRequester !== ALL_SENTINEL ? filterRequester : 'Todos os solicitantes'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>Todos os solicitantes</SelectItem>
              {requesters.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={selectAllVisible}>Selecionar visíveis</Button>
          <Button variant="secondary" onClick={exportSelected}>Exportar CSV</Button>
          <Button onClick={refresh}>Atualizar</Button>
        </div>
      </Card>

      <div className="grid gap-3">
        {current.map((e) => (
          <Card key={e.id} className="p-3 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Checkbox checked={!!selected[e.id]} onCheckedChange={() => toggleSelect(e.id)} />
                <EscopoLink href={`/escopos/${e.id}`} escopo={e}>{e.title || '—'}</EscopoLink>
                <ElapsedSince iso={e.created_at} />
              </div>
              <div className="text-sm text-muted-foreground">Solicitante: {e.requester || '—'}</div>
              <div className="text-sm text-muted-foreground">Loja: {e.store_id || '—'}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setPreview(e)}>Visualizar</Button>
                <div className="relative">
                  <Button
                    variant="link"
                    onClick={() => setNotifyOpen((s) => ({ ...s, [e.id]: !s[e.id] }))}
                    disabled={!!notifLoading[e.id]}
                  >
                    {notifLoading[e.id] ? 'Aguarde...' : 'Notificar'}
                  </Button>
                  {notifyOpen[e.id] && (
                    <div className="absolute right-0 top-8 z-10 bg-paper border rounded p-2 shadow-md w-56">
                      <div className="text-sm mb-2">Quando deseja ser notificado?</div>
                      <Select value={notifyOption[e.id] ?? 'immediate'} onValueChange={(v) => setNotifyOption((s) => ({ ...s, [e.id]: v }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue>{notifyOption[e.id] ?? 'Imediatamente'}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Imediatamente</SelectItem>
                          <SelectItem value="in_1h">Em 1 hora</SelectItem>
                          <SelectItem value="in_4h">Em 4 horas</SelectItem>
                          <SelectItem value="in_24h">Em 24 horas</SelectItem>
                          <SelectItem value="in_7d">Em 7 dias</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setNotifyOpen((s) => ({ ...s, [e.id]: false }))}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => {
                            const opt = notifyOption[e.id] ?? 'immediate';
                            setNotifyOpen((s) => ({ ...s, [e.id]: false }));
                            createNotificationFor(e, opt);
                          }}
                          disabled={!!notifLoading[e.id]}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <ReopenButton escopo={e} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <button className="btn" onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
          <span className="px-3">{page} / {totalPages}</span>
          <button className="btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Próxima</button>
        </div>
        <div>
          <button className="btn" onClick={clearSelection}>Limpar seleção</button>
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded max-w-xl w-full">
            <h3 className="text-lg font-semibold">{preview.title || 'Escopo'}</h3>
            <p className="text-sm text-muted-foreground">{preview.description}</p>
            <div className="mt-3 space-y-2">
              <div>Solicitante: {preview.requester}</div>
              <div>Loja: {preview.store_id}</div>
              <div>
                Criado em: {preview.created_at ? (typeof preview.created_at === 'string' ? preview.created_at : String(preview.created_at)) : '—'}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => { exportCsv([preview], `escopo-${preview.id}.csv`); }}>Exportar CSV</button>
              <button className="btn" onClick={() => { sessionStorage.setItem('escopo_to_load', JSON.stringify(preview)); window.location.href = '/escopos'; }}>Reabrir no editor</button>
              <button className="btn" onClick={() => setPreview(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
