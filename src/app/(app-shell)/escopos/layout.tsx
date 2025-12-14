import requireAuthOrRedirect from '@/lib/server-auth-guard';

export default async function EscoposLayout({ children }: { children: React.ReactNode }) {
  // Ensure server-side redirect for unauthenticated users before rendering
  await requireAuthOrRedirect();

  return (
    <main className="flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </main>
  );
}
