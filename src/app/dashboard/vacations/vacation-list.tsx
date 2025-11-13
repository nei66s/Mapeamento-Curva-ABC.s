
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User, VacationRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface VacationListProps {
  vacations: VacationRequest[];
  userColors: Record<string, string>;
  allUsers: User[];
  visibleUsers: Set<string>;
  onUserVisibilityChange: (userId: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

export function VacationList({ vacations, userColors, allUsers, visibleUsers, onUserVisibilityChange, onDelete }: VacationListProps) {

  const sortedVacations = useMemo(() => 
    [...vacations].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), 
  [vacations]);

  return (
    <>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Lista de Férias</CardTitle>
          <CardDescription>Todas as férias aprovadas para o ano selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Dias Úteis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedVacations.map((request, idx) => {
                      if (request.status !== 'Aprovado') return null;

                      const userColor = userColors[request.userId];

                      return (
            <TableRow key={`${request.id}-${request.userId}-${request.startDate}-${idx}`}>
            <TableCell>
              <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full vac-user-dot-${request.userId}`} />
              <Avatar className='h-8 w-8'>
                {request.userAvatarUrl && <AvatarImage src={request.userAvatarUrl} alt={request.userName} data-ai-hint="person avatar" />}
                <AvatarFallback>{request.userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{request.userName}</span>
              </div>
            </TableCell>
                        <TableCell className="text-muted-foreground">{request.userDepartment}</TableCell>
                        <TableCell>{format(parseISO(request.startDate), 'dd/MM/yy', { locale: ptBR })} - {format(parseISO(request.endDate), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                        <TableCell className="font-medium text-center">{request.totalDays !== null && request.totalDays !== undefined ? request.totalDays : 'N/A'}</TableCell>
                        <TableCell className="w-24 text-right">
                          {onDelete && (
                            <Button variant="ghost" size="sm" onClick={() => onDelete(request.id)} aria-label={`Remover férias ${request.userName}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        </TableRow>
                      )
                  })}
                  {sortedVacations.filter(v => v.status === 'Aprovado').length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              Nenhum período de férias encontrado para este ano.
                            </TableCell>
                        </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
        </CardContent>
      </Card>
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Filtros de Visualização</CardTitle>
                <CardDescription>Selecione os colaboradores para exibir no calendário.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {(() => {
                        const userIdsWithVac = new Set(vacations.map(v => String(v.userId)));
                        const usersToShow = allUsers.filter(u => userIdsWithVac.has(String(u.id)));
                        if (usersToShow.length === 0) {
                          return <div className="text-sm text-muted-foreground">Nenhum colaborador com férias para exibir filtros.</div>;
                        }
                        return usersToShow.map(user => (
                          <div key={user.id} className="flex items-center space-x-3">
                    <Checkbox
                    id={`user-filter-${user.id}`}
                    checked={visibleUsers.has(user.id)}
                    onCheckedChange={() => onUserVisibilityChange(user.id)}
                    className="border-muted-foreground data-[state=checked]:bg-transparent"
                    />
                    <div className={`h-4 w-4 rounded-full vac-user-dot-${user.id}`}></div>
                            <Label htmlFor={`user-filter-${user.id}`} className="font-medium cursor-pointer">
                              {user.name}
                            </Label>
                          </div>
                        ));
                      })()}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </>
  );
}
