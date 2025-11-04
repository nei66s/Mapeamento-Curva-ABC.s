'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import type { ComplianceChecklistItem } from "@/lib/types";
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
  onAddItem: (itemName: string) => void;
  onRemoveItem: (itemId: string) => void;
}

export function ManageChecklistItems({ items, onAddItem, onRemoveItem }: ManageChecklistItemsProps) {
  const [newItemName, setNewItemName] = useState('');

  const handleAddClick = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName.trim());
      setNewItemName('');
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
          <Input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Nome do novo item..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddClick()}
          />
          <Button onClick={handleAddClick} size="icon" disabled={!newItemName.trim()}>
            <PlusCircle className="h-4 w-4"/>
          </Button>
        </div>
        <ScrollArea className="h-32 pr-4">
           <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-md border p-2">
                <span className="text-sm">{item.name}</span>
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
