"use client";

import { useMemo } from 'react';
import { getSeasonSnapshot } from '@/lib/season';

export function SidebarSeasonCard() {
  const { seasonLabel, seasonNote, activeEvent, theme } = useMemo(() => getSeasonSnapshot(), []);
  return (
    <div className={`space-y-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${theme.backgroundClass} ${theme.borderClass}`}>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span>Estação</span>
        <span>{theme.emoji}</span>
      </div>
      <div className={`text-base ${theme.textClass}`}>{seasonLabel}</div>
      <p className={`text-[0.75rem] ${theme.textClass}`}>{seasonNote}</p>
      {activeEvent && (
        <div className="rounded-xl bg-white/80 p-3 text-[0.7rem] shadow-sm">
          <p className="font-semibold text-foreground">
            {theme.eventEmoji ?? theme.emoji} {activeEvent.name}
          </p>
          <p className="text-[0.65rem] text-foreground">{activeEvent.impact}</p>
        </div>
      )}
    </div>
  );
}
