'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { WarrantyItem, Supplier, Store, Item as CatalogItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WarrantyBulkFormProps {
  suppliers: Supplier[];
  stores: Store[];
  catalogItems: CatalogItem[];
  onSubmit: (data: Omit<WarrantyItem, 'id'>[]) => void;
  onCancel: () => void;
}

const warrantySchema = z.object({
  itemName: z.string().min(1, 'Selecione um item.'),
  storeLocation: z.string().min(1, 'Selecione uma loja.'),
  serialNumber: z.string().optional(),
  purchaseDate: z.date({ required_error: 'A data da compra é obrigatória.' }),
  warrantyEndDate: z.date({ required_error: 'A data de fim da garantia é obrigatória.' }),
  supplierId: z.string().min(1, 'Selecione um fornecedor.'),
  notes: z.string().optional(),
});

const bulkSchema = z.object({
  items: z.array(warrantySchema),
});

type BulkFormData = z.infer<typeof bulkSchema>;

export function WarrantyBulkForm({ suppliers, stores, catalogItems, onSubmit, onCancel }: WarrantyBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      items: [{
        itemName: '', storeLocation: '', serialNumber: '',
        purchaseDate: new Date(), warrantyEndDate: new Date(),
        supplierId: '', notes: ''
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleSubmit = (data: BulkFormData) => {
    const formattedData = data.items.map(item => ({
        ...item,
        purchaseDate: item.purchaseDate.toISOString(),
        warrantyEndDate: item.warrantyEndDate.toISOString(),
    }));
    onSubmit(formattedData);
  };
  
  const addNewField = () => {
     append({
        itemName: '', storeLocation: '', serialNumber: '',
        purchaseDate: new Date(), warrantyEndDate: new Date(),
        supplierId: '', notes: ''
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                <h4 className="font-semibold text-primary">Item em Garantia #{index + 1}</h4>
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
                    name={`items.${index}.storeLocation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local (Loja)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione a loja" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                    control={form.control}
                    name={`items.${index}.serialNumber`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Número de Série (Opcional)</FormLabel>
                        <FormControl>
                        <Input placeholder="Ex: ABC-12345-XYZ" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name={`items.${index}.purchaseDate`}
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data da Compra</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`items.${index}.warrantyEndDate`}
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fim da Garantia</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                    {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <FormField
                    control={form.control}
                    name={`items.${index}.supplierId`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Fornecedor da Garantia</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione um fornecedor" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
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
            Adicionar Outra Garantia
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Garantias</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
