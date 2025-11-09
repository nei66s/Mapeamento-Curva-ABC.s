import { redirect } from 'next/navigation';

export default function UsersRoutePage() {
  // simple server-side redirect so /admin/users shows the admin UI at /admin
  redirect('/admin');
}
