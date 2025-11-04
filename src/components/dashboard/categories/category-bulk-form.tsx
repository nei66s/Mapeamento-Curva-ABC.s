
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
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategoryBulkFormProps {
  onSubmit: (data: Omit<Category, 'id' | 'itemCount' | 'riskIndex'>[]) => void;
  onCancel: () => void;
}

const categorySchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  classification: z.enum(['A', 'B', 'C']),
  imageUrl: z.string().optional().refine((v) => !v || v === '' || v.startsWith('/') || v.startsWith('http://') || v.startsWith('https://'), { message: 'Por favor, insira uma URL de imagem válida.' }),
});

const bulkSchema = z.object({
    categories: z.array(categorySchema)
});

type BulkFormData = z.infer<typeof bulkSchema>;

export function CategoryBulkForm({ onSubmit, onCancel }: CategoryBulkFormProps) {
  const form = useForm<BulkFormData>({
    resolver: zodResolver(bulkSchema),
    defaultValues: {
      categories: [{ name: '', description: '', classification: 'C', imageUrl: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories"
  });

  const { toast } = useToast();
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [files, setFiles] = useState<Record<number, File | undefined>>({});
  const [uploadingAll, setUploadingAll] = useState(false);

  const handleSubmit = async (data: BulkFormData) => {
    // Upload all selected files first, then submit with imageUrl populated
    setUploadingAll(true);
    try {
      const categories = [...data.categories];
      for (let i = 0; i < categories.length; i++) {
        const file = files[i];
        if (file) {
          setUploading(prev => ({ ...prev, [i]: true }));
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          if (!res.ok) throw new Error('Upload falhou');
          const json = await res.json();
          const imageUrl = json?.imageUrl;
          if (!imageUrl) throw new Error('Resposta inválida do servidor');
          categories[i].imageUrl = imageUrl;
          // keep form values in sync
          form.setValue(`categories.${i}.imageUrl`, imageUrl);
          setUploading(prev => ({ ...prev, [i]: false }));
        }
      }

      onSubmit(categories);
      toast({ title: 'Categorias enviadas', description: `${categories.length} categorias foram criadas.` });
    } catch (err) {
      console.error('Bulk upload error', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao enviar categorias.' });
    } finally {
      setUploadingAll(false);
    }
  };
  
  const addNewField = () => {
      append({ name: '', description: '', classification: 'C', imageUrl: '' });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full max-h-[80vh]">
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <div className="space-y-6 py-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                        <h4 className="font-semibold text-primary">Categoria #{index + 1}</h4>
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
                            name={`categories.${index}.name`}
                            render={({ field }) => (
                                <FormItem>
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
                            name={`categories.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Descrição</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="Descreva o que essa categoria engloba."
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`categories.${index}.imageUrl`}
                          render={({ field }) => (
                            <FormItem className="min-w-0">
                              <FormLabel>Imagem da Categoria</FormLabel>
                              <FormControl>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          if (!file.type.startsWith('image/')) {
                                            toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Envie apenas imagens.' });
                                            return;
                                          }
                                          setFiles(prev => ({ ...prev, [index]: file }));
                                        }}
                                        disabled={uploadingAll}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      {files[index] || field.value ? (
                                        <div />
                                      ) : (
                                        <div className="h-20 w-32 flex items-center justify-center rounded bg-muted text-sm text-muted-foreground">Sem imagem</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <input type="hidden" value={field.value || ''} />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                            <FormField
                                control={form.control}
                                name={`categories.${index}.classification`}
                                render={({ field }) => (
                                <FormItem className="min-w-0">
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
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <div className="flex justify-between items-center pt-4 border-t mt-4 flex-shrink-0">
          <Button type="button" variant="outline" onClick={addNewField}>
            <PlusCircle className="mr-2" />
            Adicionar Outra Categoria
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={uploadingAll}>{uploadingAll ? 'Enviando...' : 'Salvar Categorias'}</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
