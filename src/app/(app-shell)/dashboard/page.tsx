import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Prefer the new indicators route as the canonical dashboard landing
  redirect('/indicators');
}
