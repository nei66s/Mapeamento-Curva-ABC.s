import type { ReactNode } from 'react';
import SidebarShell from '@/components/layout/sidebar-shell.client';
import requireAuthOrRedirect from '@/lib/server-auth-guard';

export default async function AppShellLayout({ children }: { children: ReactNode }) {
  await requireAuthOrRedirect();
  return <SidebarShell>{children}</SidebarShell>;
}
