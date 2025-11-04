
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import type { Item, Incident, Store } from '@/lib/types';
import { useEffect, useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface IncidentBulkFormProps {
  items: Item[];
  onSubmit: (data: Omit<Incident, 'id' | 'openedAt' | 'status' | 'lat' | 'lng'>[]) => void;
  onCancel: () => void;
}

const incidentSchema = z.object({
  itemName: z.string({ required_error: 'Selecione o item relacionado.' }).min(1, 'Item é obrigatório.'),
  location: z.string().min(1, 'Localização é obrigatória.'),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
});

const bulkSchema = z.object({
  incidents: z.array(incidentSchema),
});

type BulkFormData = z.infer<typeof bulkSchema>;

export function IncidentBulkForm({ items, onSubmit, onCancel }: IncidentBulkFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      incidents: [{ itemName: '', location: '', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'incidents',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/stores');
        if (!res.ok) throw new Error('Failed to load stores');
        const data: Store[] = await res.json();
        setStores(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleSubmit = (data: BulkFormData) => {
    onSubmit(data.incidents);
  };

  const addNewField = () => {
    append({ itemName: '', location: '', description: '' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                <h4 className="font-semibold text-primary">Incidente #{index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`incidents.${index}.itemName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Afetado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um item" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {items.map(item => (
                              <SelectItem key={item.id} value={item.name}>
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`incidents.${index}.location`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Localização</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma loja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map(store => (
                              <SelectItem key={store.id} value={store.name}>
                                {store.name} - {store.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name={`incidents.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Incidente</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva em detalhes o que aconteceu..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex justify-between items-center pt-4 border-t mt-4 flex-shrink-0">
          <Button type="button" variant="outline" onClick={addNewField}>
            <PlusCircle className="mr-2" />
            Adicionar Outro Incidente
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Incidentes</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
