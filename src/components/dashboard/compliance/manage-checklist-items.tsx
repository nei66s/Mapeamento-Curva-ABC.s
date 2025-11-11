'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import type { ComplianceChecklistItem } from "@/lib/types";
import type { Item } from '@/lib/types';
import { ClassificationBadge } from '@/components/shared/risk-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface ManageChecklistItemsProps {
  items: ComplianceChecklistItem[];
  onAddItem: (item: { id?: string; name: string; classification?: string }) => void;
  onRemoveItem: (itemId: string) => void;
}

export function ManageChecklistItems({ items, onAddItem, onRemoveItem }: ManageChecklistItemsProps) {
  const [query, setQuery] = useState('');
  const [available, setAvailable] = useState<Item[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/items');
        if (!res.ok) throw new Error('failed');
        const data: Item[] = await res.json();
        if (mounted) setAvailable(data);
      } catch (err) {
        console.error('failed to load items for checklist selector', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = query.trim()
    ? available.filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
    : available.slice(0, 20);

  const handleAddClick = () => {
    const item = available.find(i => i.id === selectedId) || available.find(i => i.name.toLowerCase() === query.toLowerCase());
    if (item) {
      onAddItem({ id: item.id, name: item.name, classification: item.classification });
      setQuery('');
      setSelectedId(null);
    }
  };

  return (
   <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Gerenciar Itens do Checklist</CardTitle>
        <CardDescription>Adicione ou remova itens da lista de verificação.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar item da Matriz (digite para filtrar)..."
              onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
            />
            {query.trim() && (
              <div className="mt-1 max-h-40 overflow-auto rounded-md border bg-background">
                  {filtered.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">Nenhum item encontrado.</div>
                ) : (
                  filtered.map(it => (
                    <button
                      key={it.id}
                      onClick={() => { setSelectedId(it.id ?? null); setQuery(it.name); }}
                      className={`w-full text-left p-2 hover:bg-muted ${selectedId === it.id ? 'bg-muted/30' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{it.name}</span>
                        <ClassificationBadge classification={it.classification} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <Button onClick={handleAddClick} size="icon" disabled={!query.trim()} title="Adicionar item selecionado">
            <PlusCircle className="h-4 w-4"/>
          </Button>
        </div>
        <ScrollArea className="h-32 pr-4">
           <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.name}</span>
                  <ClassificationBadge classification={item.classification} />
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o item de checklist{' '}
                            <span className="font-bold">{item.name}</span> de todas as lojas.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => onRemoveItem(item.id)}
                        >
                            Excluir
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
