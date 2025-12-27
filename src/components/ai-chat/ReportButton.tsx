"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ReportButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function ReportButton({ disabled = false, loading = false, onClick }: ReportButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" onClick={onClick} disabled={disabled || loading}>
            {loading ? "Gerando..." : "Gerar relatorio tecnico"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Consolida a conversa em um diagnostico estruturado</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
