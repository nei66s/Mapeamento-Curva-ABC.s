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
import type { RNC, Supplier, Incident, RncClassification } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface RncBulkFormProps {
  suppliers: Supplier[];
  incidents: Incident[];
  onSubmit: (data: Omit<RNC, 'id' | 'createdAt' | 'status'>[]) => void;
  onCancel: () => void;
}

const rncSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter pelo menos 5 caracteres.' }),
  supplierId: z.string().min(1, { message: 'Por favor, selecione um fornecedor.' }),
  incidentId: z.string().optional(),
  classification: z.enum(['Baixa', 'Moderada', 'Crítica']),
  description: z.string().min(20, { message: 'A descrição deve ter pelo menos 20 caracteres.' }),
});

const bulkSchema = z.object({
  rncs: z.array(rncSchema),
});

type BulkFormData = z.infer<typeof bulkSchema>;

export function RncBulkForm({ suppliers, incidents, onSubmit, onCancel }: RncBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      rncs: [{ title: '', supplierId: '', classification: 'Baixa', description: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'rncs',
  });

  const handleSubmit = (data: BulkFormData) => {
    onSubmit(data.rncs);
  };
  
  const addNewField = () => {
    append({ title: '', supplierId: '', classification: 'Baixa', description: '' });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                <h4 className="font-semibold text-primary">RNC #{index + 1}</h4>
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
                
                <FormField
                  control={form.control}
                  name={`rncs.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Não Conformidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Atraso na entrega de peças" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`rncs.${index}.supplierId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornecedor</FormLabel>
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
                  <FormField
                    control={form.control}
                    name={`rncs.${index}.classification`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classificação</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione a criticidade" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(['Baixa', 'Moderada', 'Crítica'] as RncClassification[]).map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
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
                    name={`rncs.${index}.incidentId`}
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Incidente Associado (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um incidente para vincular" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {incidents.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.id} - {i.itemName}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name={`rncs.${index}.description`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Detalhada</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a não conformidade..."
                          className="resize-none"
                          rows={3}
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
            Adicionar Outra RNC
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar RNCs</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
