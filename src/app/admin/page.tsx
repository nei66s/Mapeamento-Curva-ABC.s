import { redirect } from 'next/navigation';

export default function AdminRedirectPage() {
  // `/admin` was deprecated – redirect users to the consolidated admin panel
  redirect('/admin-panel/users');
}
