import React from 'react';

export const metadata = {
  title: 'Solicitar Conta',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-100 to-amber-50 flex items-center justify-center">
      <div className="w-full">{children}</div>
    </div>
  );
}
