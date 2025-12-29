"use client";
import React from 'react';
import type { MaintenanceRow, Role } from '@/lib/maintenance-types';

type Props = { row: MaintenanceRow; role: Role; onChange: (r: MaintenanceRow) => void };

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export default function Row(props: Props) {
  const { row, role } = props;
  const text = normalizeText(row.numeroChamado || '');
  const emergencial = text.includes('EMERGENCIAL');
  const corretiva = text.includes('CORRETIVA');
  const periodica = text.includes('PERIODICA') || text.includes('INCENDIO');
  const severityBorder = emergencial
    ? 'border-l-4 border-destructive/60'
    : corretiva
      ? 'border-l-4 border-warning/60'
      : periodica
        ? 'border-l-4 border-info/60'
        : 'border-l-4 border-transparent';
  const faded = row.confirmacao ? 'opacity-70' : '';
  const statusLabel = emergencial ? 'Emergencial' : corretiva ? 'Corretiva' : periodica ? 'Periódica' : 'Normal';
  const statusStyle = emergencial
    ? 'border-destructive/20 bg-destructive/10 text-destructive'
    : corretiva
      ? 'border-warning/25 bg-warning/10 text-warning'
      : periodica
        ? 'border-info/25 bg-info/10 text-info'
        : 'border-border bg-muted/40 text-muted-foreground';
  const statusDot = emergencial ? 'bg-destructive' : corretiva ? 'bg-warning' : periodica ? 'bg-info' : 'bg-muted-foreground';
  const fmtDate = (d?: string) => (d ? (d.length >= 10 ? d.slice(0, 10) : d) : 'N/D');
  const checklistTitle = role === 'leader' ? 'Acompanhamento' : 'Checklist';
  const statusPill = (value: unknown, doneLabel: string, pendingLabel: string) => {
    const done = Boolean(value);
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${done ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning'}`}
      >
        {done ? doneLabel : pendingLabel}
      </span>
    );
  };

  return (
    <div className={`surface-highlight ${severityBorder} ${faded} flex flex-col gap-4 rounded-md shadow-sm transition-shadow hover:shadow-md`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${statusDot}`} />
              {statusLabel}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 7.5v9A2.5 2.5 0 0 0 5.5 19h13A2.5 2.5 0 0 0 21 16.5v-9A2.5 2.5 0 0 0 18.5 5h-13A2.5 2.5 0 0 0 3 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 7.5l-9 6-9-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Proposta: {row.proposta || row.numeroChamado || 'N/D'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold text-foreground">{row.fornecedor || 'N/D'}</div>
            <div className="text-xs text-muted-foreground">{row.loja ? `Loja ${row.loja}` : 'Loja N/D'}</div>
            <div className="text-xs rounded bg-muted/40 px-2 py-1 text-foreground">{row.proposta || 'Proposta N/D'}</div>
            <div className="text-xs text-muted-foreground">{fmtDate(row.data)}</div>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              Responsável: <span className="font-medium text-foreground">{row.responsavel || 'N/D'}</span>
            </div>
            <div>
              Próx. ação: <span className="font-medium text-foreground">{row.responsavelProximaAcao || 'N/D'}</span>
            </div>
          </div>
        </div>

        <div className="w-full rounded-lg border border-border bg-card p-3 sm:max-w-[240px] shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground mb-2">{checklistTitle}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Requisição</span>
              {statusPill(row.requisicaoCriada, 'OK', 'Pendente')}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pedido</span>
              {statusPill(row.pedidoCriado, 'OK', 'Pendente')}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">OS</span>
              {statusPill(row.folhaServico, 'OK', 'Pendente')}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Confirmação</span>
              {statusPill(row.confirmacao, 'Confirmado', 'Em aberto')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
