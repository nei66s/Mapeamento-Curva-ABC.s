"use client";

import { useMemo } from 'react';
import { getSeasonSnapshot } from '@/lib/season';

export function SidebarSeasonCard() {
  const { seasonLabel, seasonNote, activeEvent, theme } = useMemo(() => getSeasonSnapshot(), []);
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-900/65 p-4 shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-3 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-slate-300">
        <div className="flex items-center justify-between text-[0.55rem] font-semibold text-slate-300">
          <span>Estação</span>
          <span>{theme.emoji}</span>
        </div>
      </div>
      <div className="text-base font-semibold tracking-tight text-white">{seasonLabel}</div>
      <p className="text-[0.75rem] text-slate-300">{seasonNote}</p>
      {activeEvent && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-3 text-[0.75rem] shadow-[0_12px_40px_rgba(2,6,23,0.45)]">
          <p className="font-semibold text-sm text-white">
            {theme.eventEmoji ?? theme.emoji} {activeEvent.name}
          </p>
          <p className="mt-1 text-[0.65rem] text-slate-300">{activeEvent.impact}</p>
        </div>
      )}
    </div>
  );
}
