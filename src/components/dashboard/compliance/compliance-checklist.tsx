'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ComplianceChecklistItem, StoreComplianceData, ComplianceStatus } from '@/lib/types';
import { CheckCircle2, XCircle, CircleSlash, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClassificationBadge } from '@/components/shared/risk-badge';
import { Button } from '@/components/ui/button';

interface ComplianceChecklistProps {
  checklistItems: ComplianceChecklistItem[];
  storeData: StoreComplianceData[];
  onStatusChange: (storeId: string, itemId: string, status: ComplianceStatus) => void;
  onDeleteVisit: (storeId: string) => void;
  currentDate: Date;
  isDateView: boolean;
}

const statusIcon: Record<ComplianceStatus, React.ReactNode> = {
  completed: <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden />,
  pending: <XCircle className="h-5 w-5 text-destructive" aria-hidden />,
  'not-applicable': <CircleSlash className="h-5 w-5 text-muted-foreground" aria-hidden />
};

const statusLabel: Record<ComplianceStatus, string> = {
  completed: "Concluído",
  pending: "Pendente",
  'not-applicable': "Não Aplicável",
};

// Use an explicit statuses array instead of Object.keys at runtime.
// This avoids accidental runtime errors if the labels object is unavailable
// (for example due to bundling or unexpected reassignments).
const STATUSES: ComplianceStatus[] = ['completed', 'pending', 'not-applicable'];

// Defensive normalization for incoming status values. Some rows in the DB use
// localized or legacy strings (e.g. 'Concluído', 'concluido', 'done'). Normalize
// them to the canonical ComplianceStatus so the UI (icons/labels) updates
// correctly.
const normalizeStatus = (s: any): ComplianceStatus => {
  if (!s && s !== '') return 'pending';
  const v = String(s).trim().toLowerCase();
  if (v === 'completed' || v.includes('concl') || v === 'done') return 'completed';
  if (v === 'not-applicable' || v.includes('nao aplic') || v.includes('não aplic') || v === 'n/a') return 'not-applicable';
  return 'pending';
};

export function ComplianceChecklist({
  checklistItems,
  storeData,
  onStatusChange,
  onDeleteVisit,
  currentDate,
  isDateView,
}: ComplianceChecklistProps) {

  const title = isDateView ? `Lojas do dia ${format(currentDate, 'dd/MM/yyyy')}` : `Visão Geral do Mês`;
  const description = isDateView 
    ? `${storeData.length} loja(s) com visita programada.` 
    : `Resumo de todas as visitas em ${format(currentDate, 'MMMM', {locale: ptBR})}.`;

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
            <div className="border rounded-lg overflow-auto h-[400px]">
                <Table>
                    <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="sticky left-0 bg-muted/50 z-10 font-semibold text-foreground w-[200px]">Loja</TableHead>
                        {checklistItems.map(item => (
                        <TableHead key={item.id} className="text-center min-w-[150px]">
                             <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                     <div className='flex items-center justify-center gap-2'>
                                        <span className="border-b border-dashed border-muted-foreground">{item.name}</span>
                                        <ClassificationBadge classification={item.classification} />
                                     </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.name}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TableHead>
                        ))}
                    </TableRow>
                    </TableHeader>
          <TableBody>
          {storeData.length > 0 ? storeData.map((store, idx) => (
            <TableRow key={`${store.storeId}-${idx}`}>
                        <TableCell className="sticky left-0 bg-card z-10 font-medium w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{store.storeName}</span>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" aria-label={`Excluir visita agendada para ${store.storeName}`}>
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                  <span className="sr-only">Excluir visita agendada</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Visita Agendada?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso removerá o agendamento de conformidade para a loja <span className="font-bold">{store.storeName}</span> neste dia.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteVisit(store.storeId)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
            {checklistItems.map(checklistItem => {
              const itemStatus = store.items.find(i => String(i.itemId) === String(checklistItem.id));
              const currentStatus = normalizeStatus(itemStatus?.status ?? 'pending');
                            return (
                            <TableCell key={checklistItem.id} className="text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center justify-center w-full h-full p-2 rounded-md hover:bg-muted" aria-label={`Status: ${statusLabel[currentStatus]}`}>
                                            {statusIcon[currentStatus]}
                                          </button>
                                    </DropdownMenuTrigger>
          <DropdownMenuContent>
          {STATUSES.map(status => (
                       <DropdownMenuItem key={status} onSelect={() => onStatusChange(store.storeId, checklistItem.id, status)}>
                        {statusIcon[status]}
                        <span className="ml-2">{statusLabel[status]}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            );
                        })}
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={checklistItems.length + 1} className="h-24 text-center">
                                Nenhuma loja encontrada para o período selecionado.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
