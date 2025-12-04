'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ClassificationBadge } from '@/components/shared/risk-badge';

interface ItemFormProps {
  item?: Item | null;
  categories: Category[];
  onSubmit: (data: Item) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  category: z.string().min(1, { message: 'Por favor, selecione uma categoria.' }),
  storeCount: z.coerce.number().int().min(0, { message: 'A quantidade de lojas deve ser um número positivo.' }),
  impactFactors: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Você deve selecionar ao menos um fator de impacto.",
  }),
  status: z.enum(['online', 'offline', 'maintenance']),
  leadTime: z.string().min(1, { message: 'O lead time é obrigatório.' }),
  contingencyPlan: z.string().min(10, { message: 'O plano de contingência deve ter pelo menos 10 caracteres.' }),
  imageUrl: z.string().url({ message: 'Por favor, insira uma URL de imagem válida.' }).optional().or(z.literal('')),
  id: z.string().optional(),
});

type ItemFormData = Omit<z.infer<typeof formSchema>, 'classification'>;


const calculateClassification = (impacts: string[]): Classification => {
  if (impacts.includes('safety') || impacts.includes('sales')) {
    return 'A';
  }
  if (impacts.includes('legal') || impacts.includes('brand')) {
    return 'B';
  }
  return 'C';
};

const getDefaultValues = (item: Item | null) => ({
    name: item?.name || '',
    category: item?.category || '',
    storeCount: item?.storeCount || 0,
    impactFactors: item?.impactFactors || [],
    status: item?.status || 'online',
    leadTime: item?.leadTime || '',
    contingencyPlan: item?.contingencyPlan || '',
    imageUrl: item?.imageUrl || '',
    id: item?.id || '',
});

export function ItemForm({ item, categories, onSubmit, onCancel }: ItemFormProps) {
  const form = useForm<ItemFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(item ?? null),
  });

  const { toast } = useToast();

  const watchedImpactFactors = form.watch('impactFactors', item?.impactFactors || []);
  const calculatedClassification = calculateClassification(watchedImpactFactors);

  const handleSubmit = (data: ItemFormData) => {
    const finalItem: Item = {
      ...data,
      classification: calculatedClassification,
    };
    onSubmit(finalItem);
  };
  
  useEffect(() => {
    form.reset(getDefaultValues(item ?? null));
  }, [item, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem do Item</FormLabel>
              <FormControl>
                <div>
                  <div className="flex items-center gap-3">
                    <div>
                      <input
                        id="item-image"
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (!file.type.startsWith('image/')) {
                            toast({ variant: 'destructive', title: 'Arquivo inválido', description: 'Envie apenas imagens.' });
                            return;
                          }
                          try {
                            const fd = new FormData();
                            fd.append('file', file);
                            fd.append('dest', 'items');
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
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      {/* Show actual preview when imageUrl is set. Otherwise show nothing (no placeholder). */}
                      {form.getValues('imageUrl') ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={form.getValues('imageUrl') as string}
                            alt={form.getValues('name') || 'Imagem do item'}
                            className="h-20 w-32 rounded object-cover border"
                            onError={(e) => {
                              // Fallback to a local placeholder if the image is missing.
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = '1';
                                target.src = '/logo.png';
                              }
                            }}
                          />
                          <div className="flex flex-col">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                form.setValue('imageUrl', '');
                                toast({ title: 'Imagem removida', description: 'A imagem foi removida do formulário.' });
                              }}
                            >
                              Remover foto
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <input type="hidden" value={field.value || ''} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="storeCount"
            render={({ field }) => (
              <FormItem>
              <FormLabel>Qtd. Lojas</FormLabel>
              <FormControl>
                  <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="leadTime"
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
        </div>

        <Separator />
        
        <div>
          <div className="mb-4">
            <FormLabel>Fatores de Impacto Operacional</FormLabel>
            <p className="text-sm text-muted-foreground">Selecione os impactos que a falha deste item pode causar.</p>
          </div>
          <FormField
            control={form.control}
            name="impactFactors"
            render={() => (
              <FormItem className="grid grid-cols-2 gap-4">
                {impactFactors.map((factor) => (
                  <FormField
                    key={factor.id}
                    control={form.control}
                    name="impactFactors"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={factor.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(factor.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value ?? []), factor.id])
                                  : field.onChange(
                                      (field.value ?? []).filter(
                                        (value) => value !== factor.id
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {factor.label}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
                 <FormMessage className="col-span-2" />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex items-center gap-4 rounded-md border bg-muted/50 p-3">
          <h4 className="font-semibold text-sm">Classificação Automática:</h4>
          <ClassificationBadge classification={calculatedClassification} />
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="contingencyPlan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano de Contingência</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o plano de ação em caso de falha."
                  className="resize-none"
                  rows={3}
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
            <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
