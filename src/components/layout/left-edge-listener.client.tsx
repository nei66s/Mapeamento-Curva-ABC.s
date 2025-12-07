'use client';

import { useEffect } from 'react';

export default function LeftEdgeListener({ threshold = 48 }: { threshold?: number }) {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      try {
        const near = e.clientX <= threshold;
        window.dispatchEvent(new CustomEvent('left-edge-hover', { detail: { near } }));
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [threshold]);

  return null;
}
