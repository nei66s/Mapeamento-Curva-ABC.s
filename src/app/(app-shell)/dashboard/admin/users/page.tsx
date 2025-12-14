import { redirect } from 'next/navigation';

export default function AdminUsersPage() {
  // Keep a dedicated route for UX while the canonical admin page remains the source of truth.
  redirect('/admin');
}
