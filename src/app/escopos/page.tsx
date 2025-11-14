'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';
import type { Store } from '@/lib/types';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type ScopeItem = {
  id: string;
  title: string;
  description: string;
  checklist: string[];
};

const createEmptyItem = (): ScopeItem => ({
  id: createId(),
  title: '',
  description: '',
  checklist: [],
});

async function improveScopeText(payload: { text: string; context?: string; tone?: string }) {
  const response = await fetch('/api/ai/improve-scope', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok || typeof data?.improved !== 'string') {
    throw new Error(data?.error || 'Não foi possível aprimorar o texto.');
  }
  return data.improved as string;
}

export default function EscoposPage() {
  const [scopeName, setScopeName] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const tone = 'Técnico e engenheiro';
  const [requester, setRequester] = useState('');
  const [items, setItems] = useState<ScopeItem[]>([createEmptyItem()]);
  const [listImport, setListImport] = useState('');
  const [improvingItemId, setImprovingItemId] = useState<string | null>(null);
  const [improvingScope, setImprovingScope] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);
  const [bulkImproving, setBulkImproving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadStores = async () => {
      try {
        const response = await fetch('/api/stores');
        if (!response.ok) throw new Error('Falha ao carregar lojas');
        const payload = (await response.json()) as Store[];
        if (!mounted) return;
        setStores(Array.isArray(payload) ? payload : []);
        if (Array.isArray(payload) && payload.length > 0) {
          setSelectedStoreId(prev => prev || payload[0].id);
        }
      } catch (error) {
        if (mounted) {
          setStores([]);
        }
      } finally {
        if (mounted) {
          setLoadingStores(false);
        }
      }
    };
    loadStores();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedStore = useMemo(
    () => stores.find(store => store.id === selectedStoreId) ?? null,
    [stores, selectedStoreId]
  );

  const scopeContext = useMemo(() => {
    const storeLabel = selectedStore?.name ?? 'Loja não informada';
    const requesterLabel = requester.trim() || 'Solicitante não informado';
    return `Escopo: ${scopeName || 'Novo escopo'} • Loja: ${storeLabel} • Solicitante: ${requesterLabel}`;
  }, [scopeName, selectedStore?.id, selectedStore?.name, requester]);

  const updateItem = (id: string, changes: Partial<ScopeItem>) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...changes } : item)));
  };

  const addChecklistEntry = (itemId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, checklist: [...item.checklist, ''] }
          : item
      )
    );
  };

  const updateChecklistEntry = (itemId: string, index: number, value: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const checklist = [...item.checklist];
        checklist[index] = value;
        return { ...item, checklist };
      })
    );
  };

  const removeChecklistEntry = (itemId: string, index: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const checklist = item.checklist.filter((_, idx) => idx !== index);
        return { ...item, checklist };
      })
    );
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleImproveScope = async () => {
    if (!scopeDescription.trim()) {
      toast({ title: 'Adicione uma descrição antes de usar a IA.', variant: 'destructive' });
      return;
    }
    setImprovingScope(true);
    try {
      const improved = await improveScopeText({
        text: scopeDescription,
        context: scopeContext,
        tone,
      });
      setScopeDescription(improved);
      toast({ title: 'Descrição aprimorada', description: 'A IA revisou o texto por você.' });
    } catch (error) {
      toast({
        title: 'Erro ao melhorar o texto',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setImprovingScope(false);
    }
  };

  const handleImproveItem = async (item: ScopeItem) => {
    if (!item.description.trim()) {
      toast({ title: 'Escreva a descrição antes de pedir a IA.', variant: 'destructive' });
      return;
    }
    setImprovingItemId(item.id);
    try {
      const improved = await improveScopeText({
        text: item.description,
        context: `${scopeContext} • Item: ${item.title || 'Sem título'}`,
        tone,
      });
      updateItem(item.id, { description: improved });
      toast({ title: 'Item aprimorado', description: 'Texto atualizado com a sugestão da IA.' });
    } catch (error) {
      toast({
        title: 'Erro ao melhorar a descrição',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setImprovingItemId(null);
    }
  };

  const generateItemDescription = async (title: string) => {
    const response = await fetch('/api/ai/generate-scope-item-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, context: scopeContext, tone }),
    });
    const data = await response.json();
    if (!response.ok || typeof data?.description !== 'string') {
      throw new Error(data?.error || 'Não foi possível gerar uma descrição.');
    }
    return data.description as string;
  };

  const generateDescriptionsForImportedItems = async (newItems: ScopeItem[]) => {
    if (!newItems.length) return;
    setBulkTotal(newItems.length);
    setBulkProgress(0);
    setBulkImproving(true);
    try {
      for (const item of newItems) {
        const description = await generateItemDescription(item.title);
        updateItem(item.id, { description });
        setBulkProgress(prev => prev + 1);
      }
      toast({
        title: 'Descrições geradas',
        description: 'A IA criou rascunhos para os itens importados.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao gerar descrições',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setBulkImproving(false);
      setBulkTotal(0);
      setBulkProgress(0);
    }
  };

  const importItemsFromList = async () => {
    const entries = listImport
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (!entries.length) {
      toast({ title: 'Cole uma lista antes de importar', variant: 'destructive' });
      return;
    }
    const newItems = entries.map(line => ({ ...createEmptyItem(), title: line }));
    setItems(prev => [...prev, ...newItems]);
    setListImport('');
    toast({ title: `${newItems.length} item(s) adicionados da lista.` });
    const wantsAIHelp =
      typeof window !== 'undefined'
        ? window.confirm('Deseja que a IA sugira descrições para os itens importados?')
        : false;
    if (wantsAIHelp) {
      await generateDescriptionsForImportedItems(newItems);
    }
  };

  const exportToExcel = async () => {
    if (!requester.trim()) {
      toast({ title: 'Informe o solicitante antes de exportar.', variant: 'destructive' });
      return;
    }
    if (!selectedStoreId) {
      toast({ title: 'Selecione uma loja antes de exportar.', variant: 'destructive' });
      return;
    }
    if (!items.length) {
      toast({ title: 'Adicione pelo menos um item antes de exportar.', variant: 'destructive' });
      return;
    }
    setIsExporting(true);
    try {
      const { utils, write } = await import('xlsx');
      const headerRow = ['Item nº', 'Título', 'Descrição do item', 'Checklist', 'Valor fornecedor'];
      const metadataRows = [
        ['Escopo', scopeName || '—', '', 'Solicitante', requester || '—'],
        ['Loja', selectedStore?.name ?? '—', '', 'Descrição do Escopo', scopeDescription || '—'],
        [],
      ];
      const tableRows = [
        headerRow,
        ...items.map((item, index) => [
          index + 1,
          item.title,
          item.description,
          item.checklist.filter(Boolean).join(' • '),
          '',
        ]),
      ];
      const sheetRows = [...metadataRows, ...tableRows];
      const worksheet = utils.aoa_to_sheet(sheetRows);
      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 50 },
        { wch: 35 },
        { wch: 20 },
      ];
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'FF1F2937' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
      const metadataStyle = {
        font: { bold: true, color: { rgb: 'FF111827' } },
      };
      const headerRowIndex = metadataRows.length;
      headerRow.forEach((_, colIndex) => {
        const cell = worksheet[utils.encode_cell({ r: headerRowIndex, c: colIndex })];
        if (cell) {
          cell.s = headerStyle;
        }
      });
      metadataRows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const cell = worksheet[utils.encode_cell({ r: rowIndex, c: colIndex })];
          if (cell && value) {
            cell.s = metadataStyle;
          }
        });
      });
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Escopo');
      const buffer = write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filename = (scopeName.trim() || 'escopo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      anchor.href = url;
      anchor.download = `${filename || 'escopo'}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Planilha pronta',
        description: 'Excel profissional com espaço para o fornecedor preencher valores.',
      });
    } catch (error) {
      toast({
        title: 'Não foi possível exportar',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar novo escopo</CardTitle>
          <CardDescription>
            Defina o escopo, adicione os itens e conte com a IA para deixar o texto claro e profissional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Nome do escopo</p>
              <Input
                value={scopeName}
                onChange={event => setScopeName(event.target.value)}
                placeholder="Ex.: Escopo de manutenção preventiva"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Solicitante</p>
              <Input
                value={requester}
                onChange={event => setRequester(event.target.value)}
                placeholder="Nome do responsável pelo pedido"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Loja</p>
              <select
                value={selectedStoreId}
                onChange={event => setSelectedStoreId(event.target.value)}
                disabled={loadingStores}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  {loadingStores ? 'Carregando lojas…' : 'Selecione a loja'}
                </option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Descrição do escopo</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImproveScope}
                disabled={!scopeDescription.trim() || improvingScope}
              >
                {improvingScope ? 'Melhorando…' : 'Melhorar com IA'}
              </Button>
            </div>
            <Textarea
              value={scopeDescription}
              onChange={event => setScopeDescription(event.target.value)}
              placeholder="Detalhe o objetivo, os limites e o resultado esperado do escopo."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens do escopo</CardTitle>
          <CardDescription>Dê nome aos itens, descreva o que precisa ser feito e adicione checklists para garantir cobertura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="space-y-4 rounded-2xl border border-muted-foreground/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-muted-foreground">Item {index + 1}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  Remover item
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Título</p>
                  <Input
                    placeholder="Ex.: Inspeção visual das válvulas"
                    value={item.title}
                    onChange={event => updateItem(item.id, { title: event.target.value })}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImproveItem(item)}
                    disabled={!item.description.trim() || improvingItemId === item.id}
                  >
                    {improvingItemId === item.id ? 'Melhorando…' : 'Melhorar descrição'}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Descrição do item</p>
                <Textarea
                  value={item.description}
                  onChange={event => updateItem(item.id, { description: event.target.value })}
                  placeholder="Conte o que precisa ser feito, o padrão mínimo e possíveis riscos."
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Checklist</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addChecklistEntry(item.id)}
                    aria-label="Adicionar atividade ao checklist"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {item.checklist.map((entry, idx) => (
                    <div key={`${item.id}-checklist-${idx}`} className="flex items-center gap-2">
                      <Input
                        className="flex-1"
                        placeholder={`Atividade ${idx + 1}`}
                        value={entry}
                        onChange={event => updateChecklistEntry(item.id, idx, event.target.value)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeChecklistEntry(item.id, idx)}
                        aria-label="Remover entrada do checklist"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" onClick={() => setItems(prev => [...prev, createEmptyItem()])}>
            Adicionar item
          </Button>
          <p className="text-sm text-muted-foreground">Você pode importar uma lista de tarefas ao lado para ganhar velocidade.</p>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar lista de itens</CardTitle>
          <CardDescription>
            Cole linhas separadas por enter e cada linha vira um item do escopo. Depois da importação
            perguntamos se você quer que a IA crie descrições iniciais para cada tarefa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={listImport}
            onChange={event => setListImport(event.target.value)}
            placeholder={"1. Verificar bombas\n2. Atualizar filtros\n3. Validar registros"}
            className="min-h-[140px]"
          />
          <Button
            variant="outline"
            onClick={() => void importItemsFromList()}
            className="w-full sm:w-auto"
            disabled={bulkImproving}
          >
            Transformar em itens
          </Button>
          {bulkImproving && bulkTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              IA sugerindo descrições ({bulkProgress}/{bulkTotal})
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Exportar</p>
          <p className="text-xs text-muted-foreground">Gere uma planilha compatível com Excel com o escopo criado.</p>
        </div>
        <Button variant="default" onClick={exportToExcel} disabled={isExporting}>
          {isExporting ? 'Gerando planilha…' : 'Exportar para Excel'}
        </Button>
      </div>
    </div>
  );
}
