
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Store } from '@/lib/types';

interface ScheduleVisitFormProps {
  onSubmit: (storeName: string, visitDate: Date) => void;
  onCancel: () => void;
  defaultDate?: Date;
}

const formSchema = z.object({
  storeName: z.string().min(1, { message: 'Por favor, selecione uma loja.' }),
  visitDate: z.date({ required_error: 'A data da visita é obrigatória.' }),
});

type FormData = z.infer<typeof formSchema>;

export function ScheduleVisitForm({ onSubmit, onCancel, defaultDate }: ScheduleVisitFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: '',
      visitDate: defaultDate || new Date(),
    },
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

  const handleSubmit = (data: FormData) => {
    onSubmit(data.storeName, data.visitDate);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="storeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Loja</FormLabel>
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
        <FormField
          control={form.control}
          name="visitDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data da Visita</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'PPP', { locale: ptBR })
                      ) : (
                        <span>Escolha uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date('1900-01-01')}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Agendar</Button>
        </div>
      </form>
    </Form>
  );
}
