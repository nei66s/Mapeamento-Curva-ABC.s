import { VacationPageComponent } from './vacation-page-component';
import type { VacationRequest, User } from '@/lib/types';

export default async function VacationsPage() {
  let vacations: VacationRequest[] = [];
  let users: User[] = [];

  try {
    const [vRes, uRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/vacations`, { cache: 'no-store' }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/api/users`, { cache: 'no-store' }),
    ]);
    vacations = await vRes.json().catch(() => []);
    users = await uRes.json().catch(() => []);
  } catch (e) {
    vacations = [];
    users = [];
  }

  return <VacationPageComponent initialVacations={vacations} allUsers={users} />;
}
