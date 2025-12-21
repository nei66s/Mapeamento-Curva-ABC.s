"use client";

import { useEffect } from 'react';
import { applySeasonTheme } from '@/lib/season-theme-utils';
import { getSeasonSnapshot } from '@/lib/season';

export function SeasonStatus() {
  const { seasonLabel, seasonNote, activeEvent, theme } = getSeasonSnapshot();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.documentElement.getAttribute('data-theme') === 'seasonal') {
      applySeasonTheme(theme);
    }
  }, [theme]);

  return (
    <div
      className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] shadow-sm md:flex ${theme.backgroundClass} ${theme.borderClass}`}
    >
      <span className="text-[0.65rem] text-muted-foreground">Estação</span>
      <div className="flex flex-col text-[0.65rem] leading-tight">
        <span className={`text-xs font-bold uppercase tracking-[0.3em] ${theme.textClass}`}>
          {theme.emoji} {seasonLabel}
        </span>
        <span className={`text-[0.65rem] ${theme.textClass}`}>{seasonNote}</span>
        {activeEvent && (
          <span className={`text-[0.6rem] ${theme.textClass}`}>
            {theme.eventEmoji ?? theme.emoji} {activeEvent.name} – {theme.accentText}
          </span>
        )}
      </div>
    </div>
  );
}
