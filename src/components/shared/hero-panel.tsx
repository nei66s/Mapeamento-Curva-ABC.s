'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export interface HeroStat {
  label: string;
  value: string | number;
  helper?: string;
  // optional Tailwind class to apply to the value (e.g. text-red-400)
  colorClassName?: string;
  // optional Tailwind classes to apply to the stat container (bg/border) to highlight the card
  containerClassName?: string;
}

interface HeroPanelProps {
  badge?: ReactNode;
  label: string;
  title: ReactNode;
  description: ReactNode;
  stats: HeroStat[];
  children?: ReactNode;
  gradientClassName?: string;
  className?: string;
}

export function HeroPanel({
  badge,
  label,
  title,
  description,
  stats,
  children,
  gradientClassName = 'from-orange-600 via-orange-500 to-amber-400',
  className,
}: HeroPanelProps) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-gradient-to-br p-6 text-white shadow-xl',
        gradientClassName,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/90">{label}</p>
        {badge && <div>{badge}</div>}
    </div>
    <h3 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h3>
    <p className="mt-2 text-sm text-white/80">{description}</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              // base spacing/shape
              'rounded-2xl p-4',
              // allow a custom container class or fall back to the default subtle card style
              stat.containerClassName ?? 'border border-white/30 bg-white/10'
            )}
          >
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-white/80">{stat.label}</p>
            <p className={cn('mt-1 text-2xl font-semibold', stat.colorClassName || 'text-white')}>{stat.value}</p>
            {stat.helper && <p className="text-xs text-white/60">{stat.helper}</p>}
          </div>
        ))}
      </div>
      {children && (
        <div className="mt-8 border-t border-white/30 pt-6">
          {children}
        </div>
      )}
    </div>
  );
}
