import { redirect } from 'next/navigation';

export default function RequestAccountRedirect() {
  // Permanently redirect /request-account to the canonical /signup page
  redirect('/signup');
}
