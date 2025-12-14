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
  onSubmit: (data: Omit<VacationRequest, 'id' | 'requestedAt' | 'status' | 'userName' | 'userAvatarUrl' | 'totalDays'> & { userDepartment?: string }) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  userInput: z.string().min(1, 'Digite o nome do colaborador.'),
  department: z.string().optional(),
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
      userInput: '',
      department: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    // Try to match the entered name to an existing user
    const entered = String(data.userInput || '').trim();
    const matched = users.find(u => u.name.toLowerCase() === entered.toLowerCase());
    onSubmit({
      userId: matched ? matched.id : '',
      userName: matched ? matched.name : entered,
      userDepartment: matched ? matched.department : (data.department || undefined),
      startDate: data.dateRange.from.toISOString(),
      endDate: data.dateRange.to.toISOString(),
    } as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="userInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colaborador</FormLabel>
              <FormControl>
                {/* Use a simple text input with datalist for suggestions to allow typing the name */}
                <div>
                  <input
                    list="vacation-users"
                    className="w-full rounded-md border px-3 py-2"
                    {...field}
                  />
                  <datalist id="vacation-users">
                    {users.map(u => <option key={u.id} value={u.name} />)}
                  </datalist>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento (opcional)</FormLabel>
              <FormControl>
                <div>
                  <input
                    list="vacation-departments"
                    className="w-full rounded-md border px-3 py-2"
                    {...field}
                  />
                  <datalist id="vacation-departments">
                    {Array.from(new Set(users.map(u => u.department).filter(Boolean))).map(dep => (
                      <option key={dep} value={dep} />
                    ))}
                  </datalist>
                </div>
              </FormControl>
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
