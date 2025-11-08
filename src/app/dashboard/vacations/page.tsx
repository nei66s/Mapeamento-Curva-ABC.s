import { VacationPageComponent } from './vacation-page-component';
import type { VacationRequest, User } from '@/lib/types';

async function getVacationsData(): Promise<{vacations: VacationRequest[], users: User[]}> {
  // In a real app, you would fetch this data from your database (e.g., PostgreSQL)
  const users: User[] = [
    { id: 'user-1', name: 'Ana Silva', email: 'ana.silva@example.com', role: 'gestor', department: 'Manutenção Elétrica', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
    { id: 'user-2', name: 'Bruno Costa', email: 'bruno.costa@example.com', role: 'regional', department: 'Manutenção Mecânica', avatarUrl: 'https://picsum.photos/seed/user2/100/100' },
    { id: 'user-3', name: 'Carlos Lima', email: 'carlos.lima@example.com', role: 'visualizador', department: 'Manutenção Elétrica', avatarUrl: 'https://picsum.photos/seed/user3/100/100' },
    { id: 'user-4', name: 'Daniela Souza', email: 'daniela.souza@example.com', role: 'visualizador', department: 'Manutenção Civil', avatarUrl: 'https://picsum.photos/seed/user4/100/100' },
    { id: 'user-5', name: 'Eduardo Reis', email: 'eduardo.reis@example.com', role: 'visualizador', department: 'Manutenção Mecânica', avatarUrl: 'https://picsum.photos/seed/user5/100/100' },
  ];

  const vacations: VacationRequest[] = [
    { id: 'vac-1', userId: 'user-1', userName: 'Ana Silva', userDepartment: 'Manutenção Elétrica', status: 'Aprovado', startDate: '2025-08-01', endDate: '2025-08-15', requestedAt: '2025-06-10', userAvatarUrl: 'https://picsum.photos/seed/user1/100/100' },
    { id: 'vac-2', userId: 'user-2', userName: 'Bruno Costa', userDepartment: 'Manutenção Mecânica', status: 'Aprovado', startDate: '2025-09-01', endDate: '2025-09-20', requestedAt: '2025-07-05', userAvatarUrl: 'https://picsum.photos/seed/user2/100/100' },
    { id: 'vac-3', userId: 'user-3', userName: 'Carlos Lima', userDepartment: 'Manutenção Elétrica', status: 'Aprovado', startDate: '2025-08-10', endDate: '2025-08-20', requestedAt: '2025-07-15', userAvatarUrl: 'https://picsum.photos/seed/user3/100/100' },
    { id: 'vac-4', userId: 'user-4', userName: 'Daniela Souza', userDepartment: 'Manutenção Civil', status: 'Aprovado', startDate: '2025-07-20', endDate: '2025-08-05', requestedAt: '2025-06-20', userAvatarUrl: 'https://picsum.photos/seed/user4/100/100' },
    { id: 'vac-5', userId: 'user-5', userName: 'Eduardo Reis', userDepartment: 'Manutenção Mecânica', status: 'Aprovado', startDate: '2025-10-05', endDate: '2025-10-25', requestedAt: '2025-08-01', userAvatarUrl: 'https://picsum.photos/seed/user5/100/100' },
    { id: 'vac-6', userId: 'user-1', userName: 'Ana Silva', userDepartment: 'Manutenção Elétrica', status: 'Aprovado', startDate: '2025-12-20', endDate: '2026-01-05', requestedAt: '2025-10-15', userAvatarUrl: 'https://picsum.photos/seed/user1/100/100' },
    { id: 'vac-7', userId: 'user-3', userName: 'Carlos Lima', userDepartment: 'Manutenção Elétrica', status: 'Aprovado', startDate: '2025-11-10', endDate: '2025-11-25', requestedAt: '2025-09-20', userAvatarUrl: 'https://picsum.photos/seed/user3/100/100' },
  ];
  return { vacations, users };
}

export default async function VacationsPage() {
  const { vacations, users } = await getVacationsData();

  return <VacationPageComponent initialVacations={vacations} allUsers={users} />;
}
