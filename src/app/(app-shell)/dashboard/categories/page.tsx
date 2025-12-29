
'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { CategoryForm } from '@/components/dashboard/categories/category-form';
import { CategoryBulkForm } from '@/components/dashboard/categories/category-bulk-form';
import type { Category } from '@/lib/types';
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { ClassificationBadge } from '@/components/shared/risk-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
      try {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to load categories');
        const data = await res.json();
        setCategories(data);
      } catch (e) {
        console.error(e);
        toast({
          variant: 'destructive',
          title: 'Falha ao carregar categorias',
          description: 'Não foi possível carregar as categorias do servidor.',
        });
      }
  }, [toast]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleFormSubmit = async (values: Omit<Category, 'id' | 'itemCount' | 'riskIndex'>) => {
    try {
      if (selectedCategory) {
        const body = { id: selectedCategory.id, ...values };
        const res = await fetch('/api/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update category');
        const updatedCategory: Category = await res.json();
        setCategories(categories.map(cat => (cat.id === selectedCategory.id ? updatedCategory : cat)));
        toast({ title: 'Categoria Atualizada!', description: `A categoria "${values.name}" foi atualizada.` });
      } else {
        // Create single category
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error('Failed to create category');
        const created: Category = await res.json();
        setCategories(prev => [created, ...prev]);
        toast({ title: 'Categoria Criada!', description: `A categoria "${values.name}" foi criada.` });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a categoria.' });
    } finally {
      setIsFormOpen(false);
      setSelectedCategory(null);
    }
  };
  
  const handleBulkSubmit = async (newCategories: Omit<Category, 'id' | 'itemCount' | 'riskIndex'>[]) => {
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories),
      });
      if (!res.ok) throw new Error('Failed to create categories');
      const created: Category[] = await res.json();
      setCategories(prev => [...created, ...prev]);
      toast({ title: 'Categorias Adicionadas!', description: `${created.length} novas categorias foram adicionadas.` });
      setIsBulkFormOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar as categorias.' });
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    const deletedCategory = categories.find(cat => cat.id === categoryId);
    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(categoryId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      const json = await res.json();
      if (json?.deleted) {
        setCategories(categories.filter(cat => cat.id !== categoryId));
        if (deletedCategory) {
          toast({ variant: 'destructive', title: 'Categoria Excluída!', description: `A categoria "${deletedCategory.name}" foi excluída.` });
        }
      } else {
        throw new Error('Server did not delete');
      }
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível excluir a categoria.' });
    }
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const openNewBulkDialog = () => {
    setSelectedCategory(null);
    setIsBulkFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Categorias de Itens"
        description="Gerencie as categorias (macro) para organização dos itens."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewBulkDialog} className="flex gap-2">
              <PlusCircle />
              Adicionar Categorias
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novas Categorias</DialogTitle>
            </DialogHeader>
            <CategoryBulkForm
                onSubmit={handleBulkSubmit}
                onCancel={() => setIsBulkFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Todas as Categorias</CardTitle>
          <CardDescription>
            Lista completa de categorias cadastradas no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Classificação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => (
                <TableRow key={category.id}>
                  <TableCell>
                     <div className="flex items-center gap-3">
                      <Avatar>
                        {category.imageUrl ? (
                          <AvatarImage src={category.imageUrl} alt={category.name} data-ai-hint="category image"/>
                        ) : (
                          <AvatarFallback>
                            <ImageIcon className="text-muted-foreground" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="font-medium">{category.name}</span>
                     </div>
                  </TableCell>
                   <TableCell>
                    <ClassificationBadge classification={category.classification} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{category.description}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => openEditDialog(category)}>
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
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente a categoria
                                <span className="font-bold"> {category.name}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCategory(category.id)}
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
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
            </DialogHeader>
            <CategoryForm
              category={selectedCategory}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}
