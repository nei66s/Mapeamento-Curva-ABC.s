"use client";

import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface PagePanelProps extends HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
}

export function PagePanel({ children, className, accent = false, ...rest }: PagePanelProps) {
  return (
    <div
      className={cn(
        'page-shell relative bg-white/90 border border-border/50 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition duration-200 hover:shadow-[0_25px_60px_rgba(15,23,42,0.2)] dark:bg-slate-900/70 dark:border-slate-800',
        accent ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/50' : 'bg-white/90 dark:bg-slate-900/70',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
