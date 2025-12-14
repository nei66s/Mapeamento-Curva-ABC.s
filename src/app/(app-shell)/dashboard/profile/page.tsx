"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from '@/components/ui/form';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
// permissions management moved to the central Admin page

const profileSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Por favor, insira um e-mail válido.'),
  avatarUrl: z.string().optional(),
  phone: z
    .string()
    .max(32, 'O telefone deve ter no máximo 32 caracteres.')
    .optional()
    .or(z.literal('')),
  hasWhatsapp: z.boolean().default(false),
  whatsappNotifications: z.boolean().default(false),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser, loading } = useCurrentUser();
  const router = useRouter();
  const [fetchedUser, setFetchedUser] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // keep admin detection available for future UI if needed
  const isAdminUser = fetchedUser?.role === 'admin';

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      avatarUrl: '',
      phone: '',
      hasWhatsapp: false,
      whatsappNotifications: false,
    },
  });

  const hasWhatsapp = form.watch('hasWhatsapp');

  useEffect(() => {
  if (!user) {
    setFetchedUser(null);
    form.reset({ name: '', email: '', avatarUrl: '', phone: '', hasWhatsapp: false, whatsappNotifications: false });
    return;
  }
    const load = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to load users');
        const list = await res.json();
        const latest = list.find((u: any) => String(u.id) === String(user.id)) || user;
        setFetchedUser(latest);
        form.reset({
          name: latest.name || '',
          email: latest.email || '',
          avatarUrl: latest.avatarUrl || '',
          phone: latest.profile?.phone ?? '',
          hasWhatsapp: Boolean(latest.profile?.has_whatsapp),
          whatsappNotifications: Boolean(latest.profile?.whatsapp_notifications),
        });
      } catch (err) {
        console.error('Failed to refresh user', err);
        setFetchedUser(user);
        form.reset({
          name: user.name || '',
          email: user.email || '',
          avatarUrl: user.avatarUrl || '',
          phone: '',
          hasWhatsapp: false,
          whatsappNotifications: false,
        });
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Permissions are managed centrally in the Admin page; no client-side loading here.

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const autoSaveTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleAutoSave = useCallback(
    async (data: ProfileFormData) => {
      if (!fetchedUser) {
        return;
      }
      setSaveStatus('saving');
      setSaveErrorMessage(null);

      try {
        const payload = { id: (fetchedUser as any).id, ...data };
        const method = payload.id ? 'PUT' : 'POST';
        const res = await fetch('/api/users', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          console.error('save user error', err);
          throw new Error(err?.error || 'Erro ao salvar usuário');
        }

        const saved = await res.json();
        setUser(saved);
        setFetchedUser(saved);
        setSaveStatus('saved');
      } catch (e) {
        console.error('Erro ao salvar perfil automaticamente:', e);
        setSaveStatus('error');
        setSaveErrorMessage('Não foi possível salvar automaticamente.');
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as alterações automaticamente.' });
      }
    },
    [fetchedUser, setUser, setFetchedUser, toast]
  );

  useEffect(() => {
    if (!fetchedUser) return;
    const subscription = form.watch(() => {
      if (!form.formState.isDirty) return;
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(() => {
        void form.handleSubmit(handleAutoSave)();
      }, 900);
    });
    return () => {
      subscription.unsubscribe?.();
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
    };
  }, [form, fetchedUser, handleAutoSave]);

  // permission changes handled in Admin page

  React.useEffect(() => {
    if (loading || fetchedUser) return;
    // if logout is in progress, skip redirect here to avoid double navigation
    if (typeof window !== 'undefined' && (window as any).__pm_logging_out) return;
    // don't perform an automatic redirect here; instead show a login prompt
    // so the user can choose to sign in and return to this page.
    try {
      // set a query param so the login page can redirect back after success
      // we use client-side replace to avoid adding history entries
      // but avoid immediate navigation (user may want to inspect page)
      // keep current behavior minimal: navigate to /login only when user clicks
      // We'll set a flag via router.replace to a hash to indicate unauthenticated state (no-op)
      // noop to keep behavior predictable
    } catch (e) {
      // ignore
    }
  }, [loading, fetchedUser, router]);

  // While hydrating (client-only data), render nothing to keep server and client HTML identical.
  if (loading) return null;

  if (!fetchedUser) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader>
              <CardTitle>Área restrita</CardTitle>
              <CardDescription>Você precisa entrar para visualizar e editar seu perfil.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Para atualizar seu nome ou avatar, faça login.</p>
              <div className="flex gap-2">
                <Link href={`/login?returnTo=/profile`} className="inline-flex">
                  <Button>Entrar</Button>
                </Link>
                <Button variant="ghost" onClick={() => window.location.reload()}>Recarregar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Meu Perfil"
        description="Visualize e edite suas informações pessoais."
      />
      <Form {...form}>
        <form onSubmit={event => event.preventDefault()}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Mantenha seus dados sempre atualizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20">
                    {form.watch('avatarUrl') && (
                      <AvatarImage 
                        src={form.watch('avatarUrl')} 
                        alt={fetchedUser.name} 
                        data-ai-hint="person avatar"
                      />
                    )}
                    <AvatarFallback>{form.watch('name').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isUploading || isRemoving}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      if (!file.type.startsWith('image/')) {
                        toast({
                          variant: 'destructive',
                          title: 'Erro',
                          description: 'Por favor, selecione apenas arquivos de imagem.',
                        });
                        return;
                      }

                      try {
                        setIsUploading(true);
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('dest', 'avatars');
                        // store avatar in DB for this user (requires migration)
                        formData.append('store', 'db');
                        formData.append('userId', String(fetchedUser.id));

                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });

                        if (!response.ok) throw new Error('Erro ao fazer upload');

                        const data = await response.json();
                        // mark the field as dirty so autosave picks the change up
                        form.setValue('avatarUrl', data.imageUrl, { shouldDirty: true, shouldTouch: true });
                        // trigger an immediate save so the avatarUrl is persisted now
                        try {
                          await form.handleSubmit(handleAutoSave)();
                          toast({ title: 'Sucesso!', description: 'Imagem enviada e perfil atualizado.' });
                        } catch (err) {
                          toast({ variant: 'destructive', title: 'Erro', description: 'Upload feito, mas falha ao salvar perfil automaticamente.' });
                        }
                      } catch (error) {
                        toast({
                          variant: 'destructive',
                          title: 'Erro',
                          description: 'Não foi possível fazer o upload da imagem.',
                        });
                      } finally {
                        setIsUploading(false);
                      }
                    }}
                    className="w-full max-w-[200px]"
                  />
                  {form.watch('avatarUrl') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isRemoving || isUploading}
                            onClick={async () => {
                              if (!fetchedUser) return;
                              try {
                                setIsRemoving(true);
                                const res = await fetch(`/api/users/avatar?id=${fetchedUser.id}`, { method: 'DELETE' });
                                if (!res.ok) throw new Error('Falha ao remover avatar');
                                const updated = await res.json();
                                form.setValue('avatarUrl', '');
                                setUser(updated);
                                toast({ title: 'Avatar removido', description: 'A foto do perfil foi removida.' });
                              } catch (err) {
                                console.error('Erro ao remover avatar', err);
                                toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível remover o avatar.' });
                              } finally {
                                setIsRemoving(false);
                              }
                            }}
                            aria-label="Remover foto do perfil"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover Foto</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Remover Foto
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  </div>
                  {isUploading && (
                    <p className="text-sm text-muted-foreground">Enviando...</p>
                  )}
                  {isRemoving && (
                    <p className="text-sm text-muted-foreground">Removendo...</p>
                  )}
                </div>
                <div className="grid gap-1">
                  <h3 className="text-lg font-semibold">{form.watch('name')}</h3>
                  <p className="text-sm text-muted-foreground">{form.watch('email')}</p>
                <p className="text-sm font-medium text-primary capitalize">{fetchedUser.role}</p>
                </div>
              </div>
              <input type="hidden" {...form.register('avatarUrl')} />

              <div className="grid md:grid-cols-3 gap-6">
                   <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Nome</Label>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Email</Label>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Telefone</Label>
                          <FormControl>
                            <Input type="tel" placeholder="+55 (11) 99999-0000" {...field} />
                          </FormControl>
                          <FormDescription>Inclua DDD e código do país para receber mensagens.</FormDescription>
                          <FormMessage />
                </FormItem>
              )}
            />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasWhatsapp"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="has-whatsapp-switch">Tenho WhatsApp</Label>
                          <FormDescription>Marque se você usa WhatsApp e quer receber mensagens.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            id="has-whatsapp-switch"
                            checked={field.value}
                            onCheckedChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsappNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="whatsapp-notifications-switch">Quero receber mensagens por WhatsApp</Label>
                          <FormDescription>
                            As mensagens só serão enviadas se você confirmar que tem WhatsApp habilitado.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            id="whatsapp-notifications-switch"
                            checked={field.value}
                            onCheckedChange={(value) => field.onChange(value)}
                            disabled={!hasWhatsapp}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

            </CardContent>
             <CardFooter className="justify-between">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  {saveStatus === 'saving'
                    ? 'Salvando alterações automaticamente...'
                    : saveStatus === 'error'
                      ? saveErrorMessage ?? 'Não foi possível salvar automaticamente.'
                      : 'Alterações salvas automaticamente.'}
                </p>
            </CardFooter>
          </Card>
        </form>
      </Form>
      {/* Permissions management moved to Admin page (Dashboard → Administração) */}
    </div>
  );
}
