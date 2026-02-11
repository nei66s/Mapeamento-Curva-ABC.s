"use client";
import React from 'react';

export default function ElapsedSince({ iso }: { iso?: string | null }) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!iso) return <span />;
  const created = new Date(iso).getTime();
  if (Number.isNaN(created)) return <span />;
  let diff = Math.max(0, Math.floor((now - created) / 1000));

  const days = Math.floor(diff / 86400);
  diff %= 86400;
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;

  const parts = [] as string[];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return <div className="text-xs text-muted-foreground">{parts.join(' ')}</div>;
}
