
'use client';

import { useForm } from 'react-hook-form';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WarrantyItemFormProps {
  item?: WarrantyItem | null;
  suppliers: Supplier[];
  stores: Store[];
  catalogItems: CatalogItem[];
  onSubmit: (data: Omit<WarrantyItem, 'id'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  itemName: z.string().min(1, 'Selecione um item.'),
  storeLocation: z.string().min(1, 'Selecione uma loja.'),
  serialNumber: z.string().optional(),
  purchaseDate: z.date({ required_error: 'A data da compra é obrigatória.' }),
  warrantyEndDate: z.date({ required_error: 'A data de fim da garantia é obrigatória.' }),
  supplierId: z.string().min(1, 'Selecione um fornecedor.'),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function WarrantyItemForm({ item, suppliers, stores, catalogItems, onSubmit, onCancel }: WarrantyItemFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: item?.itemName || '',
      storeLocation: item?.storeLocation || '',
      serialNumber: item?.serialNumber || '',
      purchaseDate: item ? new Date(item.purchaseDate) : new Date(),
      warrantyEndDate: item ? new Date(item.warrantyEndDate) : new Date(),
      supplierId: item?.supplierId || '',
      notes: item?.notes || '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      purchaseDate: data.purchaseDate.toISOString(),
      warrantyEndDate: data.warrantyEndDate.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
                    {catalogItems.map(i => <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="storeLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local (Loja)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a loja" />
                    </SelectTrigger>
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
          name="serialNumber"
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
            name="purchaseDate"
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
            name="warrantyEndDate"
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
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor da Garantia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex: Garantia estendida, cobre apenas peças, etc."
                  className="resize-none"
                  rows={3}
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
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
