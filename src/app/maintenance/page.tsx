"use client";
import React, { useEffect, useMemo, useState } from 'react';
import Table from '@/components/maintenance/Table';
import { PageHeader } from '@/components/shared/page-header';
import type { MaintenanceRow, Role } from '@/lib/maintenance-types';

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function MaintenancePage() {
  const [role, setRole] = useState<Role>('leader');
  const [rows, setRows] = useState<MaintenanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterFornecedor, setFilterFornecedor] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterResponsavel, setFilterResponsavel] = useState('');
  const [sortBy, setSortBy] = useState<'data' | 'loja' | 'confirmacao' | ''>('');
  const [confirmFilter, setConfirmFilter] = useState<'all' | 'pending' | 'done'>('all');

  useEffect(() => { fetchRows(); }, []);

  async function fetchRows() {
    setLoading(true);
    const res = await fetch('/api/maintenance');
    const body = await res.json();
    if (body?.ok) setRows(body.result || []);
    setLoading(false);
  }

  async function createRow() {
    const payload: Partial<MaintenanceRow> = { data: new Date().toISOString(), confirmacao: false };
    const res = await fetch('/api/maintenance', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
    const body = await res.json();
    if (body?.ok) setRows(prev => [body.result, ...prev]);
  }

  async function saveRow(updated: MaintenanceRow) {
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
    await fetch('/api/maintenance', { method: 'PUT', body: JSON.stringify(updated), headers: { 'Content-Type': 'application/json' } });
  }

  const counts = useMemo(() => rows.reduce((acc, row) => {
    acc.total += 1;
    if (row.confirmacao) acc.done += 1;
    else acc.pending += 1;
    return acc;
  }, { total: 0, pending: 0, done: 0 }), [rows]);

  const visibleRows = useMemo(() => rows
    .filter(r => !filterFornecedor || normalizeText(r.fornecedor || '').includes(normalizeText(filterFornecedor)))
    .filter(r => !filterTipo || normalizeText(r.tipoSolicitacao || '') === normalizeText(filterTipo))
    .filter(r => !filterResponsavel || normalizeText(r.responsavel || '').includes(normalizeText(filterResponsavel)))
    .filter(r => confirmFilter === 'all' ? true : (confirmFilter === 'done' ? !!r.confirmacao : !r.confirmacao))
    .sort((a, b) => {
      if (sortBy === 'data') return (b.data || '').localeCompare(a.data || '');
      if (sortBy === 'loja') return (a.loja || 0) - (b.loja || 0);
      if (sortBy === 'confirmacao') return (Number(a.confirmacao ? 1 : 0) - Number(b.confirmacao ? 1 : 0));
      return 0;
    }), [rows, filterFornecedor, filterTipo, filterResponsavel, sortBy, confirmFilter]);

  return (
    <div className="page-stack">
      <PageHeader title="Fluxo de acompanhamento de manutenção" description="Manutenção e compras">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted/40 px-2 py-1">Total {counts.total}</span>
            <span className="rounded-full bg-warning/15 px-2 py-1 text-warning">Pendentes {counts.pending}</span>
            <span className="rounded-full bg-success/15 px-2 py-1 text-success">Concluídos {counts.done}</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="role-select" className="text-xs text-muted-foreground">Perfil</label>
            <select id="role-select" value={role} onChange={e => setRole(e.target.value as Role)} className="surface-control min-w-[140px]">
              <option value="leader">Líder</option>
              <option value="intern">Estagiário</option>
            </select>
          </div>
        </div>
      </PageHeader>

      <section className="panel space-y-3">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Fornecedor
            <input
              placeholder="Buscar por fornecedor"
              value={filterFornecedor}
              onChange={e => setFilterFornecedor(e.target.value)}
              className="surface-control w-full sm:w-56"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Tipo de solicitação
            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="surface-control w-full sm:w-44">
              <option value="">Todos os tipos</option>
              <option value="Serviço">Serviço</option>
              <option value="Material">Material</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Responsável
            <input
              placeholder="Buscar por responsável"
              value={filterResponsavel}
              onChange={e => setFilterResponsavel(e.target.value)}
              className="surface-control w-full sm:w-56"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Ordenação
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="surface-control w-full sm:w-44">
              <option value="">Ordenar por</option>
              <option value="data">Data</option>
              <option value="loja">Loja</option>
              <option value="confirmacao">Status de confirmação</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Confirmação
            <select value={confirmFilter} onChange={e => setConfirmFilter(e.target.value as any)} className="surface-control w-full sm:w-40">
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="done">Concluídos</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role === 'leader' && (
            <button onClick={createRow} className="btn-variant-default px-3 py-2 text-sm">
              Novo chamado
            </button>
          )}
          <button onClick={fetchRows} className="btn-variant-outline px-3 py-2 text-sm">
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <span className="text-xs text-muted-foreground">Mostrando {visibleRows.length} registro(s)</span>
        </div>
      </section>

      {loading ? (
        <div className="surface-highlight text-sm text-muted-foreground">Carregando dados...</div>
      ) : (
        <Table rows={visibleRows} role={role} onChange={saveRow} />
      )}

      <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Destaque: linhas com palavras-chave (EMERGENCIAL / CORRETIVA / PERIÓDICA INCÊNDIO) aparecem em destaque.
      </div>
    </div>
  );
}
