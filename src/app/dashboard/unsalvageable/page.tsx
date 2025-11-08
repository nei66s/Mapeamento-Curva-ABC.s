"use client";

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnsalvageableForm } from './unsalvageable-form';
import { UnsalvageableBulkForm } from './unsalvageable-bulk-form';
import type { UnsalvageableItem, Item as CatalogItem } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function UnsalvageablePage() {
  const [items, setItems] = useState<UnsalvageableItem[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [resItems, resCatalog] = await Promise.all([
          fetch('/api/unsalvageable'),
          fetch('/api/items'),
        ]);

        let dataItems: any = [];
        let dataCatalog: any = [];

        if (resItems.ok) {
          try {
            dataItems = await resItems.json();
          } catch (e) {
            console.error('Failed to parse /api/unsalvageable JSON', e);
          }
        } else {
          console.warn('/api/unsalvageable returned', resItems.status);
        }

        if (resCatalog.ok) {
          try {
            dataCatalog = await resCatalog.json();
          } catch (e) {
            console.error('Failed to parse /api/items JSON', e);
          }
        } else {
          console.warn('/api/items returned', resCatalog.status);
        }

        setItems(Array.isArray(dataItems) ? dataItems : []);
        setCatalogItems(Array.isArray(dataCatalog) ? dataCatalog : []);
      } catch (err) {
        console.error('Failed to load unsalvageable data', err);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar dados de itens.' });
      }
    };
    load();
  }, [toast]);

  const handleCreate = async (values: Omit<UnsalvageableItem, 'id' | 'status' | 'requestDate' | 'requesterId' | 'disposalDate'>) => {
    try {
      const res = await fetch('/api/unsalvageable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('failed');
      const created: UnsalvageableItem = await res.json();
      setItems(prev => [created, ...prev]);
      toast({ title: 'Registro criado', description: 'Item inservível registrado com sucesso.' });
      setIsFormOpen(false);
    } catch (err) {
      console.error('Failed to create unsalvageable', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar o registro.' });
    }
  };

  const handleBulkCreate = async (values: Omit<UnsalvageableItem, 'id' | 'status' | 'requestDate' | 'requesterId' | 'disposalDate'>[]) => {
    try {
      const res = await fetch('/api/unsalvageable/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('failed');
      const created: UnsalvageableItem[] = await res.json();
      setItems(prev => [...created, ...prev]);
      toast({ title: 'Registros em lote criados', description: `${created.length} itens registrados.` });
      setIsBulkOpen(false);
    } catch (err) {
      console.error('Failed to create bulk', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível criar os registros em lote.' });
    }
  };

  const itemsList = useMemo(() => items || [], [items]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Itens Inservíveis" description="Registre e gerencie itens para descarte." >
        <div className="flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsFormOpen(true)} className="mr-2">Registrar Item</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Item Inservível</DialogTitle>
              </DialogHeader>
              <UnsalvageableForm catalogItems={catalogItems} onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setIsBulkOpen(true)}>Registrar em Lote</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Itens em Lote</DialogTitle>
              </DialogHeader>
              <UnsalvageableBulkForm catalogItems={catalogItems} onSubmit={handleBulkCreate} onCancel={() => setIsBulkOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <section>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {itemsList.length > 0 ? (
            itemsList.map(item => (
              <Card key={item.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{item.itemName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                  <p className="text-sm text-muted-foreground">Solicitado em: {format(new Date(item.requestDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                  <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground col-span-3 text-center py-10">Nenhum item inservível registrado.</p>
          )}
        </div>
      </section>
    </div>
  );
}
