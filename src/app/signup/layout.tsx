import React from 'react';

export const metadata = {
  title: 'Solicitar Conta',
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto" }}>
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-slate-100 to-amber-50 flex items-center justify-center">
          <div className="w-full">{children}</div>
        </div>
      </body>
    </html>
  );
}
