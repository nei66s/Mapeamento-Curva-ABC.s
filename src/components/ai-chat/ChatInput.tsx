"use client";

import React from "react";
import { Send } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  disabled?: boolean;
  loading?: boolean;
};

export default function ChatInput({ value, onChange, onSend, onKeyDown, disabled, loading }: Props) {
  return (
    <div className="w-full bg-white border-t border-gray-200 p-2 flex-shrink-0">
      <div className="flex items-center gap-3">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Digite uma mensagem..."
          className="flex-1 min-h-[44px] max-h-40 resize-none px-4 py-2 border border-gray-300 rounded-[22px] text-sm leading-6 text-slate-900 placeholder-slate-500 outline-none focus:ring-0"
          disabled={disabled}
        />
        <button
          aria-label="Enviar"
          onClick={onSend}
          disabled={disabled || loading || !value.trim()}
          className="h-10 w-10 rounded-full flex items-center justify-center bg-emerald-500 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
