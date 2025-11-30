"use client";

'use client';

'use client';

import { useMemo } from 'react';
import { getSeasonSnapshot } from '@/lib/season';

export function SidebarSeasonCard() {
  const { seasonLabel, seasonNote, activeEvent, theme } = useMemo(() => getSeasonSnapshot(), []);
  return (
    <div className="space-y-3 rounded-3xl border border-border/30 bg-white/90 p-4 shadow-lg shadow-slate-900/5 dark:bg-slate-900/80">
      <div className="rounded-2xl border border-border/30 bg-slate-900/5 px-3 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground/80">
        <div className="flex items-center justify-between text-[0.55rem] font-semibold text-muted-foreground/80">
          <span>Estação</span>
          <span>{theme.emoji}</span>
        </div>
      </div>
      <div className="text-base font-semibold tracking-tight text-foreground">{seasonLabel}</div>
      <p className="text-[0.75rem] text-muted-foreground">{seasonNote}</p>
      {activeEvent && (
        <div className="rounded-2xl border border-border/30 bg-slate-50/60 p-3 text-[0.75rem] shadow-sm backdrop-blur">
          <p className="font-semibold text-sm text-slate-900">
            {theme.eventEmoji ?? theme.emoji} {activeEvent.name}
          </p>
          <p className="mt-1 text-[0.65rem] text-slate-700">{activeEvent.impact}</p>
        </div>
      )}
    </div>
  );
}
