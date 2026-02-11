"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw } from "lucide-react";

type Props = {
  name?: string;
  status?: string;
  avatarUrl?: string | null;
  onNewChat?: () => void;
  onHistory?: () => void;
};

export default function ChatHeader({ name = "Zeca", status = "online", avatarUrl, onNewChat, onHistory }: Props) {
  return (
    <div className="w-full bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0" style={{ height: 56 }}>
      <div className="flex items-center">
        <img src={avatarUrl ?? "/uploads/avatars/zeca.png"} alt={name} className="h-9 w-9 rounded-full object-cover" />
        <div className="flex flex-col ml-3 leading-tight">
          <div className="text-sm font-medium text-slate-900">{name}</div>
          <div className="text-xs text-emerald-600">{status}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onNewChat && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onNewChat} 
            aria-label="Novo chat"
            title="Novo chat"
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        {onHistory && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onHistory} 
            aria-label="Histórico"
            title="Histórico"
            className="h-8 w-8 p-0"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
