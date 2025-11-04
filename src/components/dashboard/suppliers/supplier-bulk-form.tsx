
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
import type { Supplier } from '@/lib/types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SupplierBulkFormProps {
  onSubmit: (data: Omit<Supplier, 'id'>[]) => void;
  onCancel: () => void;
}

const supplierSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  contactName: z.string().min(3, { message: 'O nome do contato é obrigatório.' }),
  contactEmail: z.string().email('Por favor, insira um e-mail válido.'),
  cnpj: z.string().length(18, { message: 'O CNPJ deve ter o formato XX.XXX.XXX/XXXX-XX.' }),
  specialty: z.string().min(3, { message: 'A especialidade é obrigatória.' }),
});

const bulkSchema = z.object({
    suppliers: z.array(supplierSchema)
});

type BulkFormData = z.infer<typeof bulkSchema>;

const formatCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export function SupplierBulkForm({ onSubmit, onCancel }: SupplierBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      suppliers: [{ name: '', contactName: '', contactEmail: '', cnpj: '', specialty: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'suppliers'
  });

  const handleSubmit = (data: BulkFormData) => {
    onSubmit(data.suppliers);
  };
  
  const addNewField = () => {
    append({ name: '', contactName: '', contactEmail: '', cnpj: '', specialty: '' });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="space-y-6 py-4">
                {fields.map((field, index) => (
                     <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                        <h4 className="font-semibold text-primary">Fornecedor #{index + 1}</h4>
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
                            name={`suppliers.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome do Fornecedor</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Refrigeração Polar" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`suppliers.${index}.specialty`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Especialidade</FormLabel>
                                <FormControl>
                                    <Input placeholder="Refrigeração, Elétrica, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                            control={form.control}
                            name={`suppliers.${index}.contactName`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nome do Contato</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name={`suppliers.${index}.contactEmail`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email do Contato</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name={`suppliers.${index}.cnpj`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>CNPJ</FormLabel>
                                <FormControl>
                                    <Input placeholder="00.000.000/0000-00" {...field} onChange={(e) => field.onChange(formatCnpj(e.target.value))} />
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
            Adicionar Outro Fornecedor
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Fornecedores</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
