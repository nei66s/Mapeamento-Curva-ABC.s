
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import type { UnsalvageableItem, Item as CatalogItem } from '@/lib/types';

interface UnsalvageableFormProps {
  itemData?: UnsalvageableItem | null;
  catalogItems: CatalogItem[];
  onSubmit: (data: Omit<UnsalvageableItem, 'id' | 'status' | 'requestDate' | 'requesterId' | 'disposalDate'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  itemName: z.string().min(1, 'Selecione um item do catálogo.'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser pelo menos 1.'),
  reason: z.string().min(10, { message: 'O motivo deve ter pelo menos 10 caracteres.' }),
});

type FormData = z.infer<typeof formSchema>;

export function UnsalvageableForm({ itemData, catalogItems, onSubmit, onCancel }: UnsalvageableFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: itemData?.itemName || '',
      quantity: itemData?.quantity || 1,
      reason: itemData?.reason || '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="itemName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um item do catálogo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {catalogItems.map(i => (
                      <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo do Descarte</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva por que o item está sendo descartado (ex: dano irreparável, obsoleto, etc.)"
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
            </Button>
            <Button type="submit">Salvar Registro</Button>
        </div>
      </form>
    </Form>
  );
}
