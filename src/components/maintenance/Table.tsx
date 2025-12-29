"use client";
import React from 'react';
import type { MaintenanceRow, Role } from '@/lib/maintenance-types';
import Row from './Row';

type Props = { rows: MaintenanceRow[]; role: Role; onChange: (r: MaintenanceRow) => void };

export default function Table({ rows, role, onChange }: Props) {
  if (!rows.length) {
    return (
      <div className="surface-highlight text-sm text-muted-foreground">
        Nenhum chamado encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
      {rows.map(r => (
        <div key={r.id}>
          <Row row={r} role={role} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}
