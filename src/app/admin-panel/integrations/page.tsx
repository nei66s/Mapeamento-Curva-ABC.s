'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useApiKeys } from '@/hooks/use-api-keys';
import type { ApiKeyCreationResult } from '@/types/admin';
import { KeyRound, ClipboardCopy, Trash2 } from 'lucide-react';

const TTL_OPTIONS = [
  { label: 'Sem expiração', value: '0' },
  { label: '7 dias', value: '7' },
  { label: '30 dias', value: '30' },
  { label: '90 dias', value: '90' },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminIntegrationsPage() {
  const [name, setName] = useState('');
  const [ttl, setTtl] = useState('30');
  const [latestKey, setLatestKey] = useState<ApiKeyCreationResult | null>(null);
  const apiKeys = useApiKeys();
  const { toast } = useToast();

  const jsonPayload = useMemo(() => {
    const days = Number(ttl);
    if (days <= 0) return undefined;
    return new Date(Date.now() + days * MS_PER_DAY).toISOString();
  }, [ttl]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Chave copiada', description: 'Cole em sua integração de confiança.' });
    } catch (error) {
      toast({ title: 'Não foi possível copiar', description: 'Use ctrl+c para copiar manualmente.' });
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      const result = await apiKeys.create.mutateAsync({
        name: name.trim(),
        expiresAt: jsonPayload ?? null,
      });
      setLatestKey(result);
      setName('');
      setTtl('30');
      toast({ title: 'Chave criada', description: 'Cópia disponível abaixo.' });
    } catch (error) {
      toast({ title: 'Erro ao gerar chave', description: 'Revise os dados e tente novamente.', variant: 'destructive' });
    }
  };

  const handleRevoke = async (id: string, label: string) => {
    try {
      await apiKeys.revoke.mutateAsync(id);
      toast({ title: 'Chave revogada', description: `Revogou ${label}.` });
    } catch (error) {
      toast({ title: 'Erro ao revogar', description: 'Tente novamente em alguns segundos.', variant: 'destructive' });
    }
  };

  const items = apiKeys.items;
  const now = Date.now();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        moduleKey="admin-integrations"
        title="Integrações e APIs"
        description="Gere chaves seguras para automações e monitore seu ciclo de vida."
      />

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Nova chave de API
            </CardTitle>
            <CardDescription>
              Dê um nome identificável e defina um prazo de validade.
            </CardDescription>
          </div>
          <Badge variant="outline">Privada</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr,0.8fr]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Nome da integração</label>
              <Input
                placeholder="Ex.: Importador de lojas"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Validade</label>
              <Select value={ttl} onValueChange={(value) => setTtl(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TTL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={apiKeys.create.isMutating || !name.trim()}
                className="w-full"
              >
                {apiKeys.create.isMutating ? 'Gerando...' : 'Gerar chave'}
              </Button>
            </div>
          </div>
          {latestKey && (
            <Alert className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <AlertTitle>Chave criada: {latestKey.item.name}</AlertTitle>
                  <AlertDescription>Copie antes de sair; você não verá ela novamente.</AlertDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(latestKey.key)}>
                  <ClipboardCopy className="mr-2 h-4 w-4" />
                  Copiar chave
                </Button>
              </div>
              <div className="rounded border border-border/60 bg-muted px-3 py-2 text-sm font-mono text-muted-foreground break-all">
                {latestKey.key}
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Chaves existentes</CardTitle>
            <CardDescription>Revogue, copie prefixos e acompanhe o uso.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {apiKeys.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando chaves...</p>
          ) : apiKeys.isError ? (
            <p className="text-sm text-destructive">
              Falha ao carregar chaves. Atualize a página para tentar novamente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integração</TableHead>
                  <TableHead>Prefixo</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead>Último uso</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                      Nenhuma chave criada ainda.
                    </TableCell>
                  </TableRow>
                )}
                {items.map((item) => {
                  const expiresAt = item.expiresAt ? new Date(item.expiresAt).getTime() : null;
                  const isExpired = expiresAt ? expiresAt <= now : false;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.ownerName ?? item.ownerEmail ?? 'Criada automaticamente'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">Prefixo</Badge>
                          <span className="font-mono text-sm">{item.keyPrefix}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(item.createdAt)}</TableCell>
                      <TableCell>{formatDate(item.lastUsedAt)}</TableCell>
                      <TableCell>{item.expiresAt ? formatDate(item.expiresAt) : 'Nunca'}</TableCell>
                      <TableCell>
                        <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                          {isExpired ? 'Expirada' : 'Ativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              Revogar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revogar chave?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação impede o uso da chave {item.keyPrefix} e não pode ser
                                desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => void handleRevoke(item.id, item.name)}
                                disabled={apiKeys.revoke.isMutating}
                              >
                                Revogar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
