'use client';

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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User, VacationRequest } from '@/lib/types';

interface VacationFormProps {
  users: User[];
  onSubmit: (data: Omit<VacationRequest, 'id' | 'requestedAt' | 'status' | 'userName' | 'userDepartment' | 'userAvatarUrl'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  userId: z.string().min(1, 'Selecione um colaborador.'),
  dateRange: z.object({
    from: z.date({ required_error: 'A data de início é obrigatória.' }),
    to: z.date({ required_error: 'A data de término é obrigatória.' }),
  }),
}).refine(data => data.dateRange.from && data.dateRange.to && !isBefore(data.dateRange.to, data.dateRange.from), {
  message: 'A data de término não pode ser anterior à data de início.',
  path: ['dateRange'],
});

type FormData = z.infer<typeof formSchema>;

export function VacationForm({ users, onSubmit, onCancel }: VacationFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({
      userId: data.userId,
      startDate: data.dateRange.from.toISOString(),
      endDate: data.dateRange.to.toISOString(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="userId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colaborador</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Selecione um colaborador" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Período de Férias</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value?.from ? (
                        field.value.to ? (
                          <>
                            {format(field.value.from, "LLL dd, y", { locale: ptBR })} -{' '}
                            {format(field.value.to, "LLL dd, y", { locale: ptBR })}
                          </>
                        ) : (
                          format(field.value.from, "LLL dd, y", { locale: ptBR })
                        )
                      ) : (
                        <span>Escolha o período</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={field.value}
                    onSelect={field.onChange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Agendar Férias</Button>
        </div>
      </form>
    </Form>
  );
}
