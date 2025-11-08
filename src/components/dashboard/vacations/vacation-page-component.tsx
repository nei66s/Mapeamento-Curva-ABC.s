import React from 'react';
import type { User } from '@/lib/types';

type Props = {
  initialVacations: any[];
  allUsers: User[];
};

// Simple server-rendered component that displays a list of vacations.
// Kept intentionally minimal so it can be used immediately by the page
// and avoid runtime module-not-found errors.
export function VacationPageComponent({ initialVacations, allUsers }: Props) {
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
            </tr>
          </thead>
          <tbody>
            {initialVacations?.map((v: any) => (
              <tr key={v.id} className="border-t">
                <td className="p-2">{v.userName ?? v.userId}</td>
                <td className="p-2">{v.userDepartment ?? '-'}</td>
                <td className="p-2">{v.startDate}</td>
                <td className="p-2">{v.endDate}</td>
                <td className="p-2">{v.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-4 text-sm text-muted-foreground">
        <p>Total de solicitações: {initialVacations?.length ?? 0}</p>
      </div>
    </div>
  );
}

export default VacationPageComponent;
