"use client"

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

type ExistingVacation = {
  id: string;
  employeeId: string;
  from: Date;
  to: Date;
  employeeName?: string;
};

type Props = {
  open: boolean;
  conflicts: ExistingVacation[];
  onClose: () => void;
  onForceAdd: () => void;
};

export default function VacationConflictModal({ open, conflicts, onClose, onForceAdd }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Conflitos de Férias Detectados</AlertDialogTitle>
          <AlertDialogDescription>
            Encontramos {conflicts.length} conflito(s) com o período selecionado. Revise antes de confirmar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 max-h-64 overflow-auto mt-2">
          {conflicts.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum conflito.</div>
          ) : (
            conflicts.map((c) => (
              <div key={c.id} className="p-2 border rounded">
                <div className="font-medium">{c.employeeName ?? c.employeeId}</div>
                <div className="text-xs text-muted-foreground">{c.from.toLocaleDateString()} → {c.to.toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onForceAdd}>Forçar criação</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
