
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { PageHeader } from '@/components/shared/page-header';
import { ClassificationBadge } from '@/components/shared/risk-badge';
import { ItemForm } from '@/components/dashboard/matrix/item-form';
import { ItemBulkForm } from '@/components/dashboard/matrix/item-bulk-form';
import type { Item, Category } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Image as ImageIcon, ListFilter, X, Shield, ShoppingCart, Scale, Landmark, Wrench } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { impactFactors, ImpactFactor } from '@/lib/impact-factors';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const factorIconMap: Record<ImpactFactor['id'], React.ElementType> = {
  safety: Shield,
  sales: ShoppingCart,
  legal: Scale,
  brand: Landmark,
  cost: Wrench,
};


export default function MatrixPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const { toast } = useToast();
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Load items and categories from API (DB-backed)
  useEffect(() => {
    const load = async () => {
      try {
        const [itemsRes, categoriesRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/categories'),
        ]);
        if (!itemsRes.ok || !categoriesRes.ok) throw new Error('API error');
        const [itemsJson, categoriesJson] = await Promise.all([
          itemsRes.json(),
          categoriesRes.json(),
        ]);
        setItems(itemsJson);
        setCategories(categoriesJson);
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Falha ao carregar dados',
          description: 'Não foi possível carregar itens e categorias do servidor.',
        });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = useMemo(() => {
    if (!categoryFilter) {
      return items;
    }
    return items.filter(item => item.category === categoryFilter);
  }, [items, categoryFilter]);

  const handleFormSubmit = async (values: Item) => {
    if (!selectedItem || !selectedItem.id) {
      setIsFormOpen(false);
      setSelectedItem(null);
      return;
    }
    try {
      const payload = { ...values, id: selectedItem.id } as any;
      const res = await fetch('/api/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update item');
      const updated: Item = await res.json();
      setItems(prev => prev.map(it => (it.id === selectedItem.id ? updated : it)));
      toast({ title: 'Item Atualizado!', description: `O item "${updated.name}" foi atualizado com sucesso.` });
    } catch (err) {
      console.error('update item error', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atualizar o item.' });
    } finally {
      setIsFormOpen(false);
      setSelectedItem(null);
    }
  };
  
  const handleBulkFormSubmit = (newItems: Item[]) => {
      setItems(prev => [...newItems, ...prev]);
       toast({
        title: 'Itens Adicionados!',
        description: `${newItems.length} novos itens foram adicionados com sucesso.`,
      });
      setIsBulkFormOpen(false);
  }


  const handleDeleteItem = async (itemId: string) => {
    const deletedItem = items.find(item => item.id === itemId);
    try {
      const res = await fetch(`/api/items?id=${encodeURIComponent(String(itemId))}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setItems(prev => prev.filter(item => item.id !== itemId));
      if (deletedItem) toast({ variant: 'destructive', title: 'Item Excluído!', description: `O item "${deletedItem.name}" foi excluído.` });
    } catch (err) {
      console.error('delete item error', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir o item.' });
    }
  };

  const openEditDialog = (item: Item) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };
  

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(prev => (prev === category ? null : category));
  };
  
  const clearFilter = () => setCategoryFilter(null);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Matriz de Itens"
        description="Gerencie todos os itens e suas classificações."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsBulkFormOpen(true)} className="flex gap-2">
              <PlusCircle />
              Adicionar Itens
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novos Itens em Massa</DialogTitle>
            </DialogHeader>
            <ItemBulkForm
              categories={categories}
              onSubmit={handleBulkFormSubmit}
              onCancel={() => setIsBulkFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
           <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todos os Itens</CardTitle>
              <CardDescription>
                {filteredItems.length} de {items.length} itens exibidos.
              </CardDescription>
            </div>
             <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex gap-2">
                      <ListFilter className="h-4 w-4" />
                      Filtrar por Categoria
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Selecione uma categoria</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.map(cat => (
                       <DropdownMenuCheckboxItem
                        key={cat.id}
                        checked={categoryFilter === cat.name}
                        onSelect={e => e.preventDefault()}
                        onCheckedChange={() => handleCategoryFilterChange(cat.name)}
                      >
                        {cat.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {categoryFilter && (
                   <Button variant="ghost" size="icon" onClick={clearFilter} className="text-muted-foreground">
                      <X className="h-4 w-4" />
                   </Button>
                )}
             </div>
           </div>
        </CardHeader>
        <CardContent>
           <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead className="hidden sm:table-cell">Fatores de Impacto</TableHead>
                    <TableHead className="hidden lg:table-cell">Lead Time</TableHead>
                    <TableHead className="hidden xl:table-cell">Plano de Contingência</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {item.imageUrl ? (
                              <AvatarImage src={item.imageUrl} alt={item.name} data-ai-hint="item image"/>
                            ) : (
                              <AvatarFallback>
                                <ImageIcon className="text-muted-foreground" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <ClassificationBadge classification={item.classification} />
                      </TableCell>
                       <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          {item.impactFactors.map(factorId => {
                            const factorInfo = impactFactors.find(f => f.id === factorId);
                            if (!factorInfo) return null;
                            const Icon = factorIconMap[factorId as keyof typeof factorIconMap];
                            return (
                               <Tooltip key={factorId}>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="p-1.5"><Icon className="h-4 w-4" /></Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{factorInfo.label}</p>
                                  </TooltipContent>
                                </Tooltip>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{item.leadTime}</TableCell>
                      <TableCell className="hidden xl:table-cell">{item.contingencyPlan}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => openEditDialog(item)}>
                              <Pencil className="mr-2" /> Editar
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 text-destructive" /> 
                                  <span className="text-destructive">Excluir</span>
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso excluirá permanentemente o item
                                    <span className="font-bold"> {item.name}</span>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteItem(item.id!)}>
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
          </DialogHeader>
          <ItemForm
            item={selectedItem}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
