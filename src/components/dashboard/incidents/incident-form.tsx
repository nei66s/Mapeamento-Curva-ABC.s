
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { Item, Incident, Store } from '@/lib/types';

interface IncidentFormProps {
  items: Item[];
  incident?: Incident | null;
  onSubmit: (data: Omit<Incident, 'id' | 'openedAt' | 'status' | 'lat' | 'lng'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  title: z.string().optional(),
  itemName: z.string({ required_error: 'Selecione o item relacionado.' }),
  location: z.string().min(3, { message: 'A localização deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
});

type IncidentFormData = z.infer<typeof formSchema>;

export function IncidentForm({ items, incident, onSubmit, onCancel }: IncidentFormProps) {
  const [stores, setStores] = useState<Store[]>([]);
  const form = useForm<IncidentFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: (incident as any)?.title || '',
      itemName: incident?.itemName || '',
      location: incident?.location || '',
      description: incident?.description || '',
    },
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const handleAutoSave = useCallback(
    async (data: IncidentFormData) => {
      setSaveStatus('saving');
      setSaveError(null);
      try {
        await onSubmit(data);
        setSaveStatus('saved');
      } catch (err) {
        console.error('incident autosave error', err);
        setSaveStatus('error');
        setSaveError('Não foi possível salvar este incidente.');
      }
    },
    [onSubmit]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/stores');
        if (!res.ok) throw new Error('Failed to load stores');
        const data: Store[] = await res.json();
        setStores(data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);
  
  useEffect(() => {
    if (incident) {
      form.reset({
        title: (incident as any).title || '',
        itemName: incident.itemName,
        location: incident.location ?? '',
        description: incident.description ?? '',
      });
    } else {
       form.reset({
       title: '',
       itemName: '',
        location: '',
        description: '',
      });
    }
  }, [form, incident]);

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!form.formState.isDirty) return;
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        void form.handleSubmit(handleAutoSave)();
      }, 900);
    });

    return () => {
      subscription.unsubscribe?.();
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [form, handleAutoSave]);

  return (
    <Form {...form}>
      <form onSubmit={event => event.preventDefault()} className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="itemName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Item Afetado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {items.map(item => (
                        <SelectItem key={item.id} value={item.name}>
                        {item.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Localização</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione uma loja" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
            {stores.map(store => (
                            <SelectItem key={store.id} value={store.name}>
                            {store.name} - {store.city}
                            </SelectItem>
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título (opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Título personalizado para o incidente"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição do Incidente</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva em detalhes o que aconteceu, o impacto e qualquer observação relevante."
                  className="resize-none"
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
            </Button>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {saveStatus === 'saving'
                ? 'Salvando automaticamente...'
                : saveStatus === 'saved'
                  ? 'Alterações salvas automaticamente.'
                  : saveStatus === 'error'
                    ? saveError ?? 'Erro ao salvar o incidente.'
                    : 'As alterações serão salvas automaticamente.'}
            </p>
        </div>
      </form>
    </Form>
  );
}
