"use client";
import React from 'react';

export default function ReopenButton({ escopo }: { escopo: any }) {
  const onClick = React.useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('escopo_to_load', JSON.stringify(escopo));
        window.location.href = '/escopos';
      }
    } catch (e) {
      // ignore
    }
  }, [escopo]);

  return (
    <div>
      <button className="inline-flex items-center rounded bg-primary px-3 py-1 text-white" onClick={onClick}>
        Reabrir no editor
      </button>
    </div>
  );
}
