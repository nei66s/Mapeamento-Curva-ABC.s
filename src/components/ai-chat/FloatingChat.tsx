"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatWindow } from "./ChatWindow";
import { defaultProfileId } from "@/lib/ai/ai-profiles";
// prettier-ignore

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  // do not read localStorage during render/SSR — only after mount
  const [pos, setPos] = useState<{ right: number; bottom: number }>({ right: 24, bottom: 140 });
  const [mounted, setMounted] = useState(false);
  const hoverCloseTimer = useRef<number | null>(null);
  const dragging = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const posRef = useRef(pos);
  const [busy, setBusy] = useState(false);

  // hydrate saved position once after mount
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("floatingChatPos");
      if (raw) setPos(JSON.parse(raw));
    } catch (e) {}
  }, []);

  // keep a ref to latest pos so event handlers can access it without
  // forcing effect dependencies (prevents update loops)
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // add global mousemove/mouseup handlers once
  useEffect(() => {
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !start.current) return;
      moved.current = true;
      const dx = start.current.x - ev.clientX;
      const dy = start.current.y - ev.clientY;
      setPos((p) => {
        const next = { right: Math.max(8, p.right + dx), bottom: Math.max(24, p.bottom + dy) };
        return next;
      });
      start.current = { x: ev.clientX, y: ev.clientY };
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      try {
        localStorage.setItem("floatingChatPos", JSON.stringify(posRef.current));
      } catch (e) {}
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    moved.current = false;
    dragging.current = true;
    start.current = { x: e.clientX, y: e.clientY };
  };

  const openWithHover = () => {
    if (hoverCloseTimer.current) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
    setOpen(true);
  };

  const scheduleCloseAfterTimeout = (ms = 2200) => {
    if (hoverCloseTimer.current) window.clearTimeout(hoverCloseTimer.current);
    const attemptClose = () => {
      if (!busy) {
        setOpen(false);
        hoverCloseTimer.current = null;
        return;
      }
      hoverCloseTimer.current = window.setTimeout(attemptClose, 500);
    };
    hoverCloseTimer.current = window.setTimeout(attemptClose, ms);
  };

  return (
    <>
      {/* overlay: clicking outside closes */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => { if (!busy) setOpen(false) }} aria-hidden />
      )}

      <div
        aria-hidden
        style={mounted ? { right: pos.right, bottom: pos.bottom } : undefined}
        className="fixed z-50"
      >
        <div
          onPointerDown={onPointerDown}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            if (moved.current) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            setOpen((v) => !v);
          }}
          onMouseEnter={() => openWithHover()}
          onMouseLeave={() => scheduleCloseAfterTimeout(1800)}
          aria-label={open ? "Fechar chat com Zeca" : "Abrir chat com Zeca"}
          className="cursor-pointer select-none flex flex-col items-center justify-center"
        >
          <img src="/ai-avatar.png" alt="Zeca" className="h-12 w-12 rounded-full object-cover shadow-sm" />
          <div className="text-[11px] mt-1 font-medium">Zeca</div>
        </div>
      </div>

      {open && (
        <div className="fixed z-50" style={mounted ? { right: pos.right, bottom: pos.bottom + 88 } : undefined}>
          <div
            onMouseEnter={() => {
              if (hoverCloseTimer.current) {
                window.clearTimeout(hoverCloseTimer.current);
                hoverCloseTimer.current = null;
              }
            }}
            onMouseLeave={() => scheduleCloseAfterTimeout(1800)}
            className="pointer-events-auto w-[92vw] max-w-sm md:w-96 overflow-hidden"
            style={{ height: '420px' }}
          >
            <div className="transform transition-all duration-200 ease-out scale-100 opacity-100 w-full h-full">
              <ChatWindow compact initialProfileId={defaultProfileId} onBusyChange={(b) => setBusy(b)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
