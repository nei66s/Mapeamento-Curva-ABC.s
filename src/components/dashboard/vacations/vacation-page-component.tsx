"use client";

import React, { useState } from 'react';
import type { User } from '@/lib/types';

type Props = {
  initialVacations: any[];
  allUsers: User[];
};

export function VacationPageComponent({ initialVacations, allUsers }: Props) {
  const [vacations, setVacations] = useState<any[]>(initialVacations ?? []);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    if (!id) return;
    const ok = confirm('Remover esta solicitação de férias?');
    if (!ok) return;
    try {
      setLoadingId(id);
      // If the page was opened via file:// the relative fetch will fail.
      if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
        alert('A aplicação parece ter sido aberta diretamente (file://). Rode o servidor (npm run dev) e abra via http://localhost:9002');
        return;
      }

      const base = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : '';
      const url = `${base}/api/vacations?id=${encodeURIComponent(id)}`;
      const res = await fetch(url, { method: 'DELETE' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = body?.error ?? `Falha ao remover (status ${res.status})`;
        console.error('DELETE /api/vacations failed', { status: res.status, body });
        alert(msg);
        return;
      }
      // remove from local state
      setVacations((prev) => prev.filter((v) => String(v.id) !== String(id)));
    } catch (err) {
      console.error('remove error', err);
      alert('Erro ao remover solicitação de férias');
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Gestão de Férias</h1>
        <p className="text-sm text-muted-foreground">Visão geral das solicitações de férias</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="text-left">
              <th className="p-2">Colaborador</th>
              <th className="p-2">Departamento</th>
              <th className="p-2">Início</th>
              <th className="p-2">Fim</th>
              <th className="p-2">Status</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {vacations?.map((v: any) => (
              <tr key={v.id} className="border-t">
                <td className="p-2">{v.userName ?? v.userId}</td>
                <td className="p-2">{v.userDepartment ?? '-'}</td>
                <td className="p-2">{v.startDate}</td>
                <td className="p-2">{v.endDate}</td>
                <td className="p-2">{v.status}</td>
                <td className="p-2">
                  <button
                    className="px-2 py-1 rounded bg-red-600 text-white text-sm disabled:opacity-50"
                    onClick={() => handleRemove(v.id)}
                    disabled={loadingId === v.id}
                    aria-label={`Remover solicitação de ${v.userName ?? v.userId}`}>
                    {loadingId === v.id ? 'Removendo...' : 'Remover'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-4 text-sm text-muted-foreground">
        <p>Total de solicitações: {vacations?.length ?? 0}</p>
      </div>
    </div>
  );
}

export default VacationPageComponent;
