
'use client';

import { useForm } from 'react-hook-form';
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

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (data: Omit<Supplier, 'id'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  contactName: z.string().min(3, { message: 'O nome do contato é obrigatório.' }),
  contactEmail: z.string().email('Por favor, insira um e-mail válido.'),
  cnpj: z.string().length(18, { message: 'O CNPJ deve ter o formato XX.XXX.XXX/XXXX-XX.' }), // 14 digits + 4 special chars
  specialty: z.string().min(3, { message: 'A especialidade é obrigatória.' }),
});

type SupplierFormData = z.infer<typeof formSchema>;

const formatCnpj = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export function SupplierForm({ supplier, onSubmit, onCancel }: SupplierFormProps) {
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: supplier?.name || '',
      contactName: supplier?.contactName || '',
      contactEmail: supplier?.contactEmail || '',
      cnpj: supplier?.cnpj ? formatCnpj(supplier.cnpj) : '',
      specialty: supplier?.specialty || '',
    },
  });

  const handleSubmit = (data: SupplierFormData) => {
    onSubmit(data);
  };
  
  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('cnpj', formatCnpj(e.target.value));
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
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
          name="specialty"
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
            name="contactName"
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
            name="contactEmail"
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
          name="cnpj"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CNPJ</FormLabel>
              <FormControl>
                <Input placeholder="00.000.000/0000-00" {...field} onChange={handleCnpjChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
