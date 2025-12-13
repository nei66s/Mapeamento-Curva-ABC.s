'use client';

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import type { Item, Category, Classification } from '@/lib/types';
import { impactFactors } from '@/lib/impact-factors';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ClassificationBadge } from '@/components/shared/risk-badge';

interface ItemBulkFormProps {
  categories: Category[];
  onSubmit: (data: Item[]) => void;
  onCancel: () => void;
}

const itemSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  category: z.string().min(1, { message: 'Por favor, selecione uma categoria.' }),
  impactFactors: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Você deve selecionar ao menos um fator de impacto.",
  }),
  leadTime: z.string().min(1, { message: 'O lead time é obrigatório.' }),
  contingencyPlan: z.string().min(10, { message: 'O plano de contingência deve ter pelo menos 10 caracteres.' }),
});

const bulkSchema = z.object({
  items: z.array(itemSchema),
});

type ItemFormData = z.infer<typeof itemSchema>;
type BulkFormData = z.infer<typeof bulkSchema>;

const calculateClassification = (impacts: string[]): Classification => {
  if (impacts.includes('safety') || impacts.includes('sales')) {
    return 'A';
  }
  if (impacts.includes('legal') || impacts.includes('brand')) {
    return 'B';
  }
  return 'C';
};

export function ItemBulkForm({ categories, onSubmit, onCancel }: ItemBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      items: [{ name: '', category: '', impactFactors: [], leadTime: '', contingencyPlan: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedItems = form.watch('items');

  const { toast } = useToast();

  const handleSubmit = async (data: BulkFormData) => {
    const payload = data.items.map(item => ({
      ...item,
      classification: calculateClassification(item.impactFactors),
      status: 'online',
      impactFactors: item.impactFactors || [],
    }));

    try {
      const res = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Server error');
      const created = await res.json();
      onSubmit(created);
      toast({ title: 'Itens adicionados', description: `${created.length} itens criados.` });
    } catch (err) {
      console.error('Failed to create items', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível adicionar os itens.' });
    }
  };
  
  const addNewField = () => {
    append({ name: '', category: '', impactFactors: [], leadTime: '', contingencyPlan: '' });
  }

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
                            name={`items.${index}.name`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Item</FormLabel>
                                <FormControl>
                                <Input placeholder="Ex: Ar Condicionado Central" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name={`items.${index}.category`}
                          render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                          )}
                        />
                    </div>
                    
                    <FormField
                        control={form.control}
                        name={`items.${index}.impactFactors`}
                        render={() => (
                        <FormItem>
                             <FormLabel>Fatores de Impacto</FormLabel>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {impactFactors.map((factor) => (
                                <FormField
                                    key={factor.id}
                                    control={form.control}
                                    name={`items.${index}.impactFactors`}
                                    render={({ field: controllerField }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                        <Checkbox
                                            checked={controllerField.value?.includes(factor.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                              ? controllerField.onChange([...(controllerField.value ?? []), factor.id])
                                                : controllerField.onChange(
                                                    controllerField.value?.filter(
                                                        (value) => value !== factor.id
                                                    )
                                                )
                                            }}
                                        />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm">
                                        {factor.label}
                                        </FormLabel>
                                    </FormItem>
                                    )}
                                />
                                ))}
                            </div>
                             <FormMessage />
                        </FormItem>
                        )}
                    />
                     <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
                        <h4 className="font-semibold text-xs">Classificação Automática:</h4>
                        <ClassificationBadge classification={calculateClassification(watchedItems[index]?.impactFactors || [])} />
                    </div>

                     <FormField
                        control={form.control}
                        name={`items.${index}.leadTime`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Lead Time</FormLabel>
                            <FormControl>
                            <Input placeholder="Imediato, 2 horas..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name={`items.${index}.contingencyPlan`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Plano de Contingência</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="Descreva o plano de ação em caso de falha."
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
            <Button type="submit">Salvar Itens</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
