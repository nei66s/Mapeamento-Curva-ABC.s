import { CurrentUserProvider } from '@/hooks/use-current-user';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <CurrentUserProvider>
        <div className="min-h-screen w-full">{children}</div>
      </CurrentUserProvider>
    </div>
  );
}
