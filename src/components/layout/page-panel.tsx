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
        'page-shell relative border border-border/50 bg-card/90 shadow-[0_20px_45px_rgba(15,23,42,0.08)] transition duration-200 hover:shadow-[0_25px_60px_rgba(15,23,42,0.2)]',
        accent ? 'border-warning/30 bg-gradient-to-br from-warning/10 to-card' : 'bg-card/90',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
