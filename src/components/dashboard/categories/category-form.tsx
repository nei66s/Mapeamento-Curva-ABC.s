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
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: Omit<Category, 'id' | 'itemCount' | 'riskIndex'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  classification: z.enum(['A', 'B', 'C']),
  imageUrl: z.string().optional().refine((v) => !v || v === '' || v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://'), { message: 'Por favor, insira uma URL de imagem válida.' }),
});

type CategoryFormData = z.infer<typeof formSchema>;

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      classification: category?.classification || 'C',
      imageUrl: category?.imageUrl || '',
    },
  });

  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (data: CategoryFormData) => {
    onSubmit(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Envie apenas imagens.' });
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload falhou');
  const json = await res.json();
  const imageUrl = json?.imageUrl;
  if (!imageUrl) throw new Error('Resposta inválida do servidor');
  form.setValue('imageUrl', imageUrl);
      toast({ title: 'Upload concluído', description: 'Imagem enviada com sucesso.' });
    } catch (err) {
      console.error('Upload error', err);
      toast({ variant: 'destructive', title: 'Erro no upload', description: 'Não foi possível enviar a imagem.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Refrigeração" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o que essa categoria engloba."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem da Categoria</FormLabel>
              <FormControl>
                <div>
                  <div className="flex items-center gap-3">
                    <div>
                      <input
                        id="category-image"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    </div>
                  <div className="flex-1">
                    {form.getValues('imageUrl') ? (
                      <div />
                    ) : (
                      <div className="h-20 w-32 flex items-center justify-center rounded bg-muted text-sm text-muted-foreground">Sem imagem</div>
                    )}
                  </div>
                  </div>
                  <input type="hidden" value={field.value || ''} />
                </div>
              </FormControl>
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
                      <SelectValue placeholder="Selecione a classificação" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A">A - Mais Valiosos</SelectItem>
                    <SelectItem value="B">B - Valor Intermediário</SelectItem>
                    <SelectItem value="C">C - Menos Valiosos</SelectItem>
                  </SelectContent>
                </Select>
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
