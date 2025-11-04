
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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

interface AddMonthFormProps {
  onSubmit: (year: number, month: number) => void;
  onCancel: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}));

const formSchema = z.object({
  year: z.coerce.number(),
  month: z.coerce.number(),
});

type FormData = z.infer<typeof formSchema>;

export function AddMonthForm({ onSubmit, onCancel }: AddMonthFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: currentYear,
      month: new Date().getMonth() + 1,
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit(data.year, data.month);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {years.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {months.map(m => (
                        <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Adicionar Mês</Button>
        </div>
      </form>
    </Form>
  );
}
