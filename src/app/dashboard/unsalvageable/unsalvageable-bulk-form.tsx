
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UnsalvageableBulkFormProps {
  catalogItems: CatalogItem[];
  onSubmit: (data: Omit<UnsalvageableItem, 'id' | 'status' | 'requestDate' | 'requesterId' | 'disposalDate'>[]) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  itemName: z.string().min(1, 'Selecione um item.'),
  quantity: z.coerce.number().int().min(1, 'A quantidade deve ser pelo menos 1.'),
  reason: z.string().min(10, { message: 'O motivo deve ter pelo menos 10 caracteres.' }),
});

const bulkSchema = z.object({
  items: z.array(formSchema),
});

type BulkFormData = z.infer<typeof bulkSchema>;

export function UnsalvageableBulkForm({ catalogItems, onSubmit, onCancel }: UnsalvageableBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      items: [{ itemName: '', quantity: 1, reason: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleSubmit = (data: BulkFormData) => {
    onSubmit(data.items);
  };
  
  const addNewField = () => {
    append({ itemName: '', quantity: 1, reason: '' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                <h4 className="font-semibold text-primary">Item #{index + 1}</h4>
                 {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                        control={form.control}
                        name={`items.${index}.itemName`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {catalogItems.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
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
                  name={`items.${index}.reason`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo do Descarte</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva por que o item é inservível."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-between items-center pt-4 border-t mt-4 flex-shrink-0">
          <Button type="button" variant="outline" onClick={addNewField}>
            <PlusCircle className="mr-2" />
            Adicionar Outro Item
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Registros</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
