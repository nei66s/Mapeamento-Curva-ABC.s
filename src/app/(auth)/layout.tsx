export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-950">
      <div className="min-h-screen w-full">{children}</div>
    </div>
  );
}
