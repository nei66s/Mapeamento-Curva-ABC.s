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
import type { SettlementLetter, Supplier } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';

interface SettlementFormProps {
  suppliers: Supplier[];
  onSubmit: (data: Omit<SettlementLetter, 'id' | 'requestDate' | 'status' | 'receivedDate'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  supplierId: z.string().min(1, { message: 'Por favor, selecione um fornecedor.' }),
  contractId: z.string().min(3, { message: 'O ID do contrato/serviço é obrigatório.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  periodStartDate: z.date({ required_error: 'A data de início do período é obrigatória.' }),
  periodEndDate: z.date({ required_error: 'A data de fim do período é obrigatória.' }),
});

type FormData = z.infer<typeof formSchema>;

export function SettlementForm({ suppliers, onSubmit, onCancel }: SettlementFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      contractId: '',
      description: '',
      periodStartDate: new Date(),
      periodEndDate: new Date(),
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
        ...data,
        periodStartDate: data.periodStartDate.toISOString(),
        periodEndDate: data.periodEndDate.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
         <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.cnpj})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        
        <FormField
          control={form.control}
          name="contractId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contrato / Ordem de Serviço</FormLabel>
              <FormControl>
                <Input placeholder="Ex: CT-2024-SERV-01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Serviço/Contrato</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o serviço que foi concluído e precisa de quitação."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="periodStartDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Início do Período</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
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
                name="periodEndDate"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Fim do Período</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={'outline'}
                            className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                            >
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
        
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
            </Button>
            <Button type="submit">Registrar Solicitação</Button>
        </div>
      </form>
    </Form>
  );
}
