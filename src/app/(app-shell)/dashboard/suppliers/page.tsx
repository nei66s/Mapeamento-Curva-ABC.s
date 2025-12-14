
'use client';

import { useEffect, useState } from 'react';
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
import { SupplierForm } from '@/components/dashboard/suppliers/supplier-form';
import { SupplierBulkForm } from '@/components/dashboard/suppliers/supplier-bulk-form';
import type { Supplier } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/suppliers?limit=${pageSize}&offset=${page * pageSize}`);
        if (!res.ok) throw new Error('Failed to load suppliers');
        const data: Supplier[] = await res.json();
        setSuppliers(data);
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Falha ao carregar fornecedores', description: 'Não foi possível carregar a lista de fornecedores.' });
      }
    };
    load();
  }, [page]);

  const handleFormSubmit = (values: Omit<Supplier, 'id'>) => {
    (async () => {
      try {
        if (selectedSupplier) {
          const res = await fetch('/api/suppliers', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedSupplier.id, ...values }),
          });
          if (!res.ok) throw new Error('Failed to update supplier');
          const updated: Supplier = await res.json();
          setSuppliers(suppliers.map(sup => (sup.id === selectedSupplier.id ? updated : sup)));
          toast({ title: 'Fornecedor Atualizado!', description: `O fornecedor "${values.name}" foi atualizado.` });
        } else {
          const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          if (!res.ok) throw new Error('Failed to create supplier');
          const created: Supplier = await res.json();
          setSuppliers(prev => [created, ...prev]);
          toast({ title: 'Fornecedor Criado!', description: `O fornecedor "${values.name}" foi criado.` });
        }
      } catch (e) {
        console.error(e);
        toast({ title: 'Erro', description: 'Não foi possível salvar o fornecedor.' });
      } finally {
        setIsFormOpen(false);
        setSelectedSupplier(null);
      }
    })();
  };
  
  const handleBulkSubmit = (newSuppliers: Omit<Supplier, 'id'>[]) => {
      (async () => {
        try {
          const res = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSuppliers),
          });
          if (!res.ok) throw new Error('Failed to create suppliers');
          const created: Supplier[] = await res.json();
          setSuppliers(prev => [...created, ...prev]);
          toast({ title: 'Fornecedores Adicionados!', description: `${created.length} novos fornecedores foram adicionados.` });
        } catch (e) {
          console.error(e);
          toast({ title: 'Erro', description: 'Não foi possível adicionar os fornecedores.' });
        } finally {
          setIsBulkFormOpen(false);
        }
      })();
  }

  const handleDelete = (supplierId: string) => {
    (async () => {
      try {
        const res = await fetch(`/api/suppliers?id=${encodeURIComponent(supplierId)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        const deleted = suppliers.find(sup => sup.id === supplierId);
        setSuppliers(suppliers.filter(sup => sup.id !== supplierId));
        if (deleted) {
          toast({ variant: 'destructive', title: 'Fornecedor Excluído!', description: `O fornecedor "${deleted.name}" foi excluído.` });
        }
      } catch (e) {
        console.error(e);
        toast({ title: 'Erro', description: 'Não foi possível excluir o fornecedor.' });
      }
    })();
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const openNewBulkDialog = () => {
    setSelectedSupplier(null);
    setIsBulkFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Fornecedores"
        description="Gerencie fornecedores e prestadores de serviço."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewBulkDialog} className="flex gap-2">
              <PlusCircle />
              Adicionar Fornecedores
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novos Fornecedores</DialogTitle>
            </DialogHeader>
            <SupplierBulkForm
              onSubmit={handleBulkSubmit}
              onCancel={() => setIsBulkFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
          <CardHeader>
          <CardTitle>Todos os Fornecedores</CardTitle>
          <CardDescription>
            Lista de fornecedores e prestadores de serviço cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map(supplier => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell><Badge variant="secondary">{supplier.specialty}</Badge></TableCell>
                   <TableCell>
                     <div className="flex flex-col">
                        <span className="font-medium">{supplier.contactName}</span>
                        <span className="text-sm text-muted-foreground">{supplier.contactEmail}</span>
                     </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{supplier.cnpj}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => openEditDialog(supplier)}>
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
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor
                                <span className="font-bold"> {supplier.name}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(supplier.id)}
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
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Página {page + 1}</div>
              <div className="flex gap-2">
                <Button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Anterior</Button>
                <Button onClick={() => setPage(p => p + 1)}>Próxima</Button>
              </div>
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
            </DialogHeader>
            <SupplierForm
              supplier={selectedSupplier}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}
