"use client";

import { getSeasonSnapshot } from '@/lib/season';

export function SidebarSeasonCard() {
  const { seasonLabel, seasonNote, activeEvent, theme } = getSeasonSnapshot();
  return (
    <div className="space-y-3 rounded-3xl border border-surface-border bg-surface-background p-4 shadow-sm">
      <div className="rounded-2xl border border-surface-border bg-card/60 px-3 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
        <div className="flex items-center justify-between text-[0.55rem] font-semibold text-muted-foreground">
          <span>Estação</span>
          <span>{theme.emoji}</span>
        </div>
      </div>
      <div className="text-base font-semibold tracking-tight text-surface-foreground">{seasonLabel}</div>
      <p className="text-[0.75rem] text-muted-foreground">{seasonNote}</p>
      {activeEvent && (
        <div className="rounded-2xl border border-surface-border bg-card/50 p-3 text-[0.75rem] shadow-sm">
          <p className="font-semibold text-sm text-surface-foreground">
            {theme.eventEmoji ?? theme.emoji} {activeEvent.name}
          </p>
          <p className="mt-1 text-[0.65rem] text-muted-foreground">{activeEvent.impact}</p>
        </div>
      )}
    </div>
  );
}
