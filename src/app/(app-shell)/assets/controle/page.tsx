"use client";

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/shared/page-header';
import { AssetRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function AssetControlPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch('/api/assets');
        if (!res.ok) throw new Error('Não foi possível carregar os ativos');
        const data: AssetRecord[] = await res.json();
        setAssets(data);
      } catch (error) {
        console.error(error);
        toast({ title: 'Erro', description: 'Não foi possível carregar os ativos.' });
      }
    };

    fetchAssets();
  }, [toast]);

  const aggregate = useMemo(() => {
    const byStore = new Map<string, AssetRecord[]>();
    assets.forEach(asset => {
      const key = asset.storeName || 'Sem loja';
      const bucket = byStore.get(key) ?? [];
      bucket.push(asset);
      byStore.set(key, bucket);
    });
    return Array.from(byStore.entries());
  }, [assets]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Controle de Ativos"
        description="Monitoramento rápido dos ativos cadastrados, insumos e componentes para manutenção."
      />

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>Contabilize ativos por loja e visualize o estado de manutenção.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border/50 p-4">
            <p className="text-sm text-muted-foreground">Total de ativos</p>
            <p className="text-2xl font-semibold">{assets.length}</p>
          </div>
          <div className="rounded-lg border border-border/50 p-4">
            <p className="text-sm text-muted-foreground">Ativos com componentes críticos</p>
            <p className="text-2xl font-semibold">
              {assets.filter(asset => asset.componentes.some(comp => comp.criticality === 'Crítica')).length}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 p-4">
            <p className="text-sm text-muted-foreground">Última atualização</p>
            <p className="text-2xl font-semibold">
              {assets.length === 0 ? '-' : formatDistanceToNow(parseISO(assets[0].updatedAt), { addSuffix: true })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status por loja</CardTitle>
          <CardDescription className="max-w-2xl">
            Os ativos são agrupados por unidade para facilitar a leitura das hierarquias e componentes críticos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {aggregate.map(([storeName, list]) => (
            <div key={storeName} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{storeName}</h3>
                <Badge variant="secondary">{list.length} ativos</Badge>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="hidden md:table-cell">Patrimônio</TableHead>
                    <TableHead>Componentes críticos</TableHead>
                    <TableHead className="hidden lg:table-cell">Hierarquia</TableHead>
                    <TableHead className="text-right">Atualizado há</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map(asset => {
                    const criticals = asset.componentes.filter(comp => ['Alta', 'Crítica'].includes(comp.criticality || ''));
                    return (
                      <TableRow key={asset.id}>
                        <TableCell>
                          <div className="font-semibold">{asset.name}</div>
                          <p className="text-xs text-muted-foreground">{asset.description || '—'}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">
                          {asset.patrimony || '—'}
                        </TableCell>
                        <TableCell>
                          {criticals.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Nenhum</span>
                          ) : (
                            criticals.map(comp => (
                              <Badge key={comp.name} variant="destructive">
                                {comp.name}
                              </Badge>
                            ))
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {asset.hierarchy || '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatDistanceToNow(parseISO(asset.updatedAt), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ))}
          {aggregate.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum ativo cadastrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
