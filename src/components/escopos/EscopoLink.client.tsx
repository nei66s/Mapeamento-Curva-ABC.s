"use client";
import React from 'react';

export default function EscopoLink({ href, escopo, children }: { href: string; escopo: any; children: React.ReactNode }) {
  const onClick = React.useCallback((ev: React.MouseEvent) => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('escopo_to_load', JSON.stringify(escopo));
      }
    } catch (err) {
      // ignore
    }
  }, [escopo]);

  return (
    <a href={href} className="font-semibold text-primary" onClick={onClick}>
      {children}
    </a>
  );
}
