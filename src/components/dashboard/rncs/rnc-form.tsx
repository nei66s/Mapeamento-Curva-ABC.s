
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
import type { RNC, Supplier, Incident, RncClassification } from '@/lib/types';

interface RncFormProps {
  rnc?: RNC | null;
  suppliers: Supplier[];
  incidents: Incident[];
  onSubmit: (data: Omit<RNC, 'id' | 'createdAt' | 'status'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter pelo menos 5 caracteres.' }),
  supplierId: z.string().min(1, { message: 'Por favor, selecione um fornecedor.' }),
  incidentId: z.string().optional(),
  classification: z.enum(['Baixa', 'Moderada', 'Crítica']),
  description: z.string().min(20, { message: 'A descrição deve ter pelo menos 20 caracteres.' }),
});

type RncFormData = z.infer<typeof formSchema>;

export function RncForm({ rnc, suppliers, incidents, onSubmit, onCancel }: RncFormProps) {
  const form = useForm<RncFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: rnc?.title || '',
      supplierId: rnc?.supplierId || '',
      incidentId: rnc?.incidentId || '',
      classification: rnc?.classification || 'Baixa',
      description: rnc?.description || '',
    },
  });

  const handleSubmit = (data: RncFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <FormField
          control={form.control}
          name="title"
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
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="classification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classificação</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a criticidade" />
                    </SelectTrigger>
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
            name="incidentId"
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Detalhada</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a não conformidade, incluindo datas, locais, pessoas envolvidas e o impacto gerado."
                  className="resize-none"
                  rows={5}
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
            <Button type="submit">Salvar RNC</Button>
        </div>
      </form>
    </Form>
  );
}
