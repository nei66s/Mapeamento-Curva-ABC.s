
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
import { WarrantyItemForm } from '@/components/dashboard/warranty/warranty-form';
import { WarrantyBulkForm } from '@/components/dashboard/warranty/warranty-bulk-form';
import type { WarrantyItem, Supplier, Store, Item as CatalogItem } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, CalendarClock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WarrantyPage() {
  const [warrantyItems, setWarrantyItems] = useState<WarrantyItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<WarrantyItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [wRes, sRes, stRes, iRes] = await Promise.all([
          fetch('/api/warranty'),
          fetch('/api/suppliers'),
          fetch('/api/stores'),
          fetch('/api/items'),
        ]);
        const [w, s, st, i] = await Promise.all([
          wRes.json(),
          sRes.json(),
          stRes.json(),
          iRes.json(),
        ]);
        setWarrantyItems(Array.isArray(w) ? w : []);
        setSuppliers(Array.isArray(s) ? s : []);
        setStores(Array.isArray(st) ? st : []);
        setCatalogItems(Array.isArray(i) ? i : []);
      } catch (e) {
        console.error('Failed to load warranty dependencies', e);
      }
    };
    loadAll();
  }, []);

  const suppliersMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

  const handleFormSubmit = (values: Omit<WarrantyItem, 'id'>) => {
    if (selectedItem) {
      const updatedItem = { ...selectedItem, ...values };
      setWarrantyItems(
        warrantyItems.map(item => (item.id === selectedItem.id ? updatedItem : item))
      );
      toast({
        title: 'Garantia Atualizada!',
        description: `A garantia para "${values.itemName}" foi atualizada.`,
      });
    }
    setIsFormOpen(false);
    setSelectedItem(null);
  };
  
  const handleBulkSubmit = (newItems: Omit<WarrantyItem, 'id'>[]) => {
      const itemsToAdd: WarrantyItem[] = newItems.map(item => ({
        ...item,
        id: `WAR-${Date.now()}-${Math.random()}`,
      }));
      setWarrantyItems(prev => [...itemsToAdd, ...prev]);
      toast({
          title: 'Garantias Adicionadas!',
          description: `${itemsToAdd.length} novos itens em garantia foram adicionados.`
      });
      setIsBulkFormOpen(false);
  }

  const handleDelete = (itemId: string) => {
    const deleted = warrantyItems.find(item => item.id === itemId);
    setWarrantyItems(warrantyItems.filter(item => item.id !== itemId));
    if (deleted) {
      toast({
        variant: 'destructive',
        title: 'Item Excluído!',
        description: `A garantia para "${deleted.itemName}" foi excluída.`,
      });
    }
  };

  const openEditDialog = (item: WarrantyItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const getStatusBadge = (endDate: string) => {
    const today = new Date();
    const warrantyEndDate = parseISO(endDate);
    const daysRemaining = differenceInDays(warrantyEndDate, today);

    if (daysRemaining < 0) {
      return <Badge variant="outline">Expirada</Badge>;
    }
    if (daysRemaining <= 30) {
      return <Badge variant="destructive">Expira em {daysRemaining}d</Badge>;
    }
    if (daysRemaining <= 90) {
      return <Badge variant="accent">Expira em {daysRemaining}d</Badge>;
    }
    return <Badge variant="success">Ativa</Badge>;
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Gestão de Garantias"
        description="Acompanhe os itens e equipamentos que estão no período de garantia."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsBulkFormOpen(true)} className="flex gap-2">
              <PlusCircle />
              Adicionar Garantias
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Adicionar Itens em Garantia em Massa</DialogTitle>
            </DialogHeader>
            <WarrantyBulkForm
              suppliers={suppliers}
              stores={stores}
              catalogItems={catalogItems}
              onSubmit={handleBulkSubmit}
              onCancel={() => setIsBulkFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Itens em Garantia</CardTitle>
          <CardDescription>
            Lista de equipamentos com garantia ativa ou recém-expirada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item / Local</TableHead>
                <TableHead className="hidden md:table-cell">Nº de Série</TableHead>
                <TableHead className="hidden lg:table-cell">Fornecedor</TableHead>
                <TableHead>Fim da Garantia</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warrantyItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-muted-foreground">{item.storeLocation}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono text-xs">{item.serialNumber || 'N/A'}</TableCell>
                  <TableCell className="hidden lg:table-cell">{suppliersMap.get(item.supplierId) || 'Desconhecido'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground"/>
                        {format(parseISO(item.warrantyEndDate), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.warrantyEndDate)}</TableCell>
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
                            <DropdownMenuItem onSelect={e => e.preventDefault()}>
                              <Trash2 className="mr-2 text-destructive" />
                              <span className="text-destructive">Excluir</span>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o registro de garantia para
                                <span className="font-bold"> {item.itemName}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                              >
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
        </CardContent>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Item em Garantia</DialogTitle>
            </DialogHeader>
            <WarrantyItemForm
              item={selectedItem}
              suppliers={suppliers}
              stores={stores}
              catalogItems={catalogItems}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}
