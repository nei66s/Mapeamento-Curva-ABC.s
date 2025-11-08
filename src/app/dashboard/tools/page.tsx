
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/page-header';
import { ToolForm } from '@/components/dashboard/tools/tool-form';
import { ToolBulkForm } from '@/components/dashboard/tools/tool-bulk-form';
import type { Tool, ToolStatus, User } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Wrench, User, CircleOff, AlertCircle, CalendarCheck2, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';


const statusVariantMap: Record<ToolStatus, 'success' | 'accent' | 'destructive'> = {
  Disponível: 'success',
  'Em Uso': 'accent',
  'Em Manutenção': 'destructive',
};

const allStatuses: ToolStatus[] = ['Disponível', 'Em Uso', 'Em Manutenção'];

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showNeedsReview, setShowNeedsReview] = useState(false);

  const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.name])), [users]);

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, uRes] = await Promise.all([
          fetch('/api/tools'),
          fetch('/api/users'),
        ]);
        if (tRes.ok) setTools(await tRes.json());
        if (uRes.ok) setUsers(await uRes.json());
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
        const searchMatch = tool.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const reviewMatch = !showNeedsReview || (tool.lastMaintenance ? differenceInDays(new Date(), parseISO(tool.lastMaintenance)) > 180 : true);

        return searchMatch && reviewMatch;
    });
  }, [tools, searchTerm, showNeedsReview]);


  const persist = async (tool: Tool) => {
    try {
      await fetch('/api/tools', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tool) });
    } catch (e) {
      console.error('Failed to persist tool', e);
    }
  };

  const handleEditSubmit = (values: Omit<Tool, 'id' | 'status' | 'assignedTo' | 'lastMaintenance'>) => {
    if (selectedTool) {
      const updatedTool = { ...selectedTool, ...values } as Tool;
      setTools(prev => prev.map(tool => (tool.id === selectedTool.id ? updatedTool : tool)));
      persist(updatedTool);
      toast({ title: 'Ferramenta Atualizada!', description: `A ferramenta "${values.name}" foi atualizada.` });
    }
    setIsEditFormOpen(false);
    setSelectedTool(null);
  };
  
  const handleBulkSubmit = async (newTools: Omit<Tool, 'id'|'status'>[]) => {
    try {
      const payload = newTools.map(t => ({ ...t, status: 'Disponível' as const }));
      const res = await fetch('/api/tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create tools');
      const created: Tool[] = await res.json();
      setTools(prev => [...created, ...prev]);
      toast({ title: 'Ferramentas Adicionadas!', description: `${created.length} novas ferramentas foram adicionadas ao almoxarifado.` });
    } catch (e) {
      console.error('bulk tools create error', e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar as ferramentas.' });
    } finally {
      setIsBulkFormOpen(false);
    }
  }

  const openEditDialog = (tool: Tool) => {
    setSelectedTool(tool);
    setIsEditFormOpen(true);
  };

  const handleStatusChange = (toolId: string, status: ToolStatus) => {
    setTools(prev =>
      prev.map(tool => {
        if (tool.id !== toolId) return tool;
        const updated = {
          ...tool,
          status,
          assignedTo: status !== 'Em Uso' ? undefined : tool.assignedTo,
          lastMaintenance: status === 'Em Manutenção' ? new Date().toISOString() : tool.lastMaintenance,
        } as Tool;
        persist(updated);
        return updated;
      })
    );
    toast({ title: 'Status Alterado', description: `O status da ferramenta foi alterado para "${status}".` });
  };
  
  const handleAssignUser = (toolId: string, userId: string) => {
    setTools(prev =>
      prev.map(tool => {
        if (tool.id !== toolId) return tool;
        const updated = { ...tool, assignedTo: userId, status: 'Em Uso' } as Tool;
        persist(updated);
        return updated;
      })
    );
    const userName = usersMap.get(userId) || 'Desconhecido';
    toast({ title: 'Ferramenta Atribuída', description: `A ferramenta foi atribuída a ${userName}.` });
  };
  
  const handleUnassignUser = (toolId: string) => {
     setTools(prev =>
      prev.map(tool => {
        if (tool.id !== toolId) return tool;
        const updated = { ...tool, assignedTo: undefined, status: 'Disponível' } as Tool;
        persist(updated);
        return updated;
      })
    );
    toast({ title: 'Ferramenta Devolvida', description: 'A ferramenta agora está disponível no almoxarifado.' });
  }

  const handleRegisterReview = (toolId: string) => {
     setTools(prev =>
      prev.map(tool => {
        if (tool.id !== toolId) return tool;
        const updated = { ...tool, lastMaintenance: new Date().toISOString() } as Tool;
        persist(updated);
        return updated;
      })
    );
    toast({ title: 'Revisão Registrada!', description: 'A data da última revisão da ferramenta foi atualizada.' });
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Almoxarifado de Ferramentas"
        description="Gerencie o inventário e a alocação de ferramentas para os técnicos."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
            <DialogTrigger asChild>
                <Button className="flex gap-2">
                    <PlusCircle />
                    Adicionar Ferramentas
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Adicionar Novas Ferramentas</DialogTitle>
                </DialogHeader>
                <ToolBulkForm 
                    onSubmit={handleBulkSubmit}
                    onCancel={() => setIsBulkFormOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
           <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Inventário de Ferramentas</CardTitle>
              <CardDescription>
                {filteredTools.length} de {tools.length} ferramentas exibidas.
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
               <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground"/>
                <Switch
                  id="needs-review-filter"
                  checked={showNeedsReview}
                  onCheckedChange={setShowNeedsReview}
                />
                <Label htmlFor="needs-review-filter">Revisão Pendente</Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead className="hidden sm:table-cell">Nº de Série</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Última Revisão</TableHead>
                    <TableHead className="hidden md:table-cell">Técnico Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map(tool => {
                    const needsReview = tool.lastMaintenance ? differenceInDays(new Date(), parseISO(tool.lastMaintenance)) > 180 : true;
                    return (
                        <TableRow key={tool.id}>
                        <TableCell>
                            <div className="font-medium">{tool.name}</div>
                            <div className="text-sm text-muted-foreground">{tool.category}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-xs">{tool.serialNumber || 'N/A'}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariantMap[tool.status]}>{tool.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            {tool.lastMaintenance ? format(parseISO(tool.lastMaintenance), 'dd/MM/yyyy') : 'N/A'}
                            {needsReview && (
                                <Tooltip>
                                <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Revisão semestral pendente!</p>
                                </TooltipContent>
                                </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                            {tool.assignedTo ? usersMap.get(tool.assignedTo) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => openEditDialog(tool)}>
                                <Pencil className="mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleRegisterReview(tool.id)}>
                                 <CalendarCheck2 className="mr-2" /> Registrar Revisão
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Wrench className="mr-2" /> Alterar Status
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    {allStatuses.map(status => (
                                    <DropdownMenuItem key={status} onSelect={() => handleStatusChange(tool.id, status)} disabled={tool.status === status}>
                                        {status}
                                    </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <User className="mr-2" /> Atribuir a Técnico
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onSelect={() => handleUnassignUser(tool.id)} disabled={!tool.assignedTo}>
                                        <CircleOff className="mr-2"/> Devolver ao estoque
                                    </DropdownMenuItem>
                                    {users.map(user => (
                                    <DropdownMenuItem key={user.id} onSelect={() => handleAssignUser(tool.id, user.id)} disabled={tool.assignedTo === user.id}>
                                        {user.name}
                                    </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
      
       <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Ferramenta</DialogTitle>
            </DialogHeader>
            <ToolForm 
                tool={selectedTool} 
                onSubmit={handleEditSubmit} 
                onCancel={() => setIsEditFormOpen(false)} 
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}
