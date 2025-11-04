
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
import type { Tool } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ToolBulkFormProps {
  onSubmit: (data: Omit<Tool, 'id' | 'status'>[]) => void;
  onCancel: () => void;
}

const toolSchema = z.object({
  name: z.string().min(3, { message: 'O nome da ferramenta é obrigatório.' }),
  category: z.enum(['Manual', 'Elétrica', 'Medição', 'EPI']),
  serialNumber: z.string().optional(),
  purchaseDate: z.date({ required_error: 'A data da compra é obrigatória.' }),
});

const bulkFormSchema = z.object({
  tools: z.array(toolSchema),
});

type BulkFormData = z.infer<typeof bulkFormSchema>;

export function ToolBulkForm({ onSubmit, onCancel }: ToolBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkFormSchema),
    defaultValues: {
      tools: [{ name: '', category: 'Manual', purchaseDate: new Date(), serialNumber: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tools',
  });

  const handleSubmit = (data: BulkFormData) => {
    const formattedTools = data.tools.map(tool => ({
        ...tool,
        purchaseDate: tool.purchaseDate.toISOString(),
    }));
    onSubmit(formattedTools);
  };
  
  const addNewField = () => {
    append({ name: '', category: 'Manual', purchaseDate: new Date(), serialNumber: '' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className='space-y-6 py-4'>
                {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                    <h4 className='font-semibold text-primary'>Ferramenta #{index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name={`tools.${index}.name`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Ferramenta</FormLabel>
                            <FormControl>
                            <Input placeholder="Ex: Furadeira de Impacto" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`tools.${index}.category`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Manual">Manual</SelectItem>
                                <SelectItem value="Elétrica">Elétrica</SelectItem>
                                <SelectItem value="Medição">Medição</SelectItem>
                                <SelectItem value="EPI">EPI</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </div>

                    <FormField
                        control={form.control}
                        name={`tools.${index}.serialNumber`}
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
                    
                    <FormField
                        control={form.control}
                        name={`tools.${index}.purchaseDate`}
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
            <Button
                type="button"
                variant="outline"
                onClick={addNewField}
            >
                <PlusCircle className="mr-2" />
                Adicionar Outra Ferramenta
            </Button>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="submit">Salvar Ferramentas</Button>
            </div>
        </div>
      </form>
    </Form>
  );
}
