"use client";

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

// Note: this is a client page moved to components — server wrapper ensures auth.

async function improveScopeText(payload: { text: string; context?: string; tone?: string; preferenceText?: string }) {
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

export default function EscoposPageClient() {
  const [scopeName, setScopeName] = useState('');
  const [scopeDescription, setScopeDescription] = useState('');
  const tone = 'Técnico e engenheiro';
  const [requester, setRequester] = useState('');
  const [items, setItems] = useState<ScopeItem[]>([createEmptyItem()]);
  const [listImport, setListImport] = useState('');
  const [improvingItemId, setImprovingItemId] = useState<string | null>(null);
  const [improvingScope, setImprovingScope] = useState(false);
  const [aiPreference, setAiPreference] = useState<'detail' | 'supplier'>('detail');
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

  const selectedStoreName = selectedStore?.name ?? null;

  const scopeContext = useMemo(() => {
    const storeLabel = selectedStoreName ?? 'Loja não informada';
    const requesterLabel = requester.trim() || 'Solicitante não informado';
    return `Escopo: ${scopeName || 'Novo escopo'} • Loja: ${storeLabel} • Solicitante: ${requesterLabel}`;
  }, [scopeName, selectedStoreId, requester, selectedStoreName]);

  const preferenceText = useMemo(() => {
    return aiPreference === 'detail'
      ? 'O autor solicita que a descrição detalhe os serviços e materiais necessários.'
      : 'Deixar a critério do fornecedor: usar normas e especificações aplicáveis ao serviço.';
  }, [aiPreference]);

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
        preferenceText,
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
        preferenceText,
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
      body: JSON.stringify({ title, context: scopeContext, tone, preferenceText }),
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
      const sanitizeForSpreadsheet = (value: unknown) => {
        const str = String(value ?? '');
        // Prevent CSV/Excel formula injection.
        if (/^[=+\-@]/.test(str)) return `'${str}`;
        return str;
      };

      const escapeCsv = (value: unknown) => {
        const v = sanitizeForSpreadsheet(value);
        const needsQuotes = /[";\n\r]/.test(v);
        const escaped = v.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      };

      const sep = ';';
      const companyName = 'Sua Empresa';
      const now = new Date();

      const rows: Array<Array<unknown>> = [];
      rows.push([`${companyName} — ${now.toLocaleString()}`]);
      rows.push(['Escopo', scopeName || '—', '', 'Solicitante', requester || '—']);
      rows.push(['Loja', selectedStore?.name ?? '—', '', 'Descrição do Escopo', scopeDescription || '—']);
      rows.push([]);
      rows.push(['Item nº', 'Título', 'Descrição do item', 'Checklist', 'Valor fornecedor']);
      for (const [idx, item] of items.entries()) {
        rows.push([
          idx + 1,
          item.title,
          item.description,
          item.checklist.filter(Boolean).join('\n'),
          '',
        ]);
      }

      const csv = '\uFEFF' + rows.map(r => r.map(escapeCsv).join(sep)).join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filename = (scopeName.trim() || 'escopo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      anchor.href = url;
      anchor.download = `${filename || 'escopo'}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Arquivo pronto',
        description: 'CSV pronto para abrir no Excel (com proteção contra fórmulas).',
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

  const exportToPdf = async () => {
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
      const [jspdfModule, html2canvas] = await Promise.all([
        import('jspdf').then(m => m as any),
        import('html2canvas').then(m => m.default ?? m),
      ]);

      const container = document.createElement('div');
      container.style.width = '900px';
      container.style.padding = '20px';
      container.style.fontFamily = 'var(--font-body)';
      container.style.background = '#ffffff';
      container.style.color = '#111827';

      const title = document.createElement('h2');
      title.innerText = 'Sua Empresa — ' + new Date().toLocaleString();
      title.style.margin = '0 0 8px 0';
      title.style.fontSize = '18px';
      container.appendChild(title);

      const metaTable = document.createElement('table');
      metaTable.style.width = '100%';
      metaTable.style.marginBottom = '12px';
      metaTable.style.borderCollapse = 'collapse';
      const metaRow1 = metaTable.insertRow();
      const m1c1 = metaRow1.insertCell(); m1c1.innerText = 'Escopo'; m1c1.style.fontWeight = '700';
      const m1c2 = metaRow1.insertCell(); m1c2.innerText = scopeName || '—';
      const m1c3 = metaRow1.insertCell(); m1c3.innerText = 'Solicitante'; m1c3.style.fontWeight = '700';
      const m1c4 = metaRow1.insertCell(); m1c4.innerText = requester || '—';
      const metaRow2 = metaTable.insertRow();
      const m2c1 = metaRow2.insertCell(); m2c1.innerText = 'Loja'; m2c1.style.fontWeight = '700';
      const m2c2 = metaRow2.insertCell(); m2c2.innerText = selectedStore?.name ?? '—';
      const m2c3 = metaRow2.insertCell(); m2c3.innerText = 'Descrição do Escopo'; m2c3.style.fontWeight = '700';
      const m2c4 = metaRow2.insertCell(); m2c4.innerText = scopeDescription || '—';
      [m1c1,m1c2,m1c3,m1c4,m2c1,m2c2,m2c3,m2c4].forEach(c => { c.style.padding = '4px 6px'; c.style.border = '0'; });
      container.appendChild(metaTable);

      const tbl = document.createElement('table');
      tbl.style.width = '100%';
      tbl.style.borderCollapse = 'collapse';
      tbl.style.fontSize = '12px';
      const thead = tbl.createTHead();
      const hrow = thead.insertRow();
      ['Item nº', 'Título', 'Descrição do item', 'Checklist', 'Valor fornecedor'].forEach((h) => {
        const th = document.createElement('th');
        th.innerText = h;
        th.style.background = '#1F2937';
        th.style.color = '#fff';
        th.style.padding = '8px';
        th.style.border = '1px solid #ddd';
        th.style.textAlign = 'left';
        hrow.appendChild(th);
      });
      const tbody = tbl.createTBody();
      items.forEach((item, idx) => {
        const row = tbody.insertRow();
        const c0 = row.insertCell(); c0.innerText = String(idx + 1); c0.style.padding = '6px'; c0.style.border = '1px solid #eee';
        const c1 = row.insertCell(); c1.innerText = item.title; c1.style.padding = '6px'; c1.style.border = '1px solid #eee';
        const c2 = row.insertCell(); c2.innerText = item.description; c2.style.padding = '6px'; c2.style.border = '1px solid #eee';
        const c3 = row.insertCell(); c3.innerText = item.checklist.filter(Boolean).join('\n'); c3.style.padding = '6px'; c3.style.border = '1px solid #eee';
        const c4 = row.insertCell(); c4.innerText = 'R$ 0,00'; c4.style.padding = '6px'; c4.style.border = '1px solid #eee';
      });
      const totRow = tbody.insertRow();
      const t0 = totRow.insertCell(); t0.innerText = ''; t0.style.border = 'none';
      const t1 = totRow.insertCell(); t1.innerText = ''; t1.style.border = 'none';
      const t2 = totRow.insertCell(); t2.innerText = ''; t2.style.border = 'none';
      const t3 = totRow.insertCell(); t3.innerText = 'Total'; t3.style.fontWeight = '700'; t3.style.padding = '6px'; t3.style.border = '1px solid #eee';
      const t4 = totRow.insertCell(); t4.innerText = 'R$ 0,00'; t4.style.fontWeight = '700'; t4.style.padding = '6px'; t4.style.border = '1px solid #eee';

      container.appendChild(tbl);

      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const canvas = await html2canvas(container as any, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const jsPDFCtor = jspdfModule?.jsPDF ?? jspdfModule?.default ?? jspdfModule;
      const pdf = new (jsPDFCtor as any)({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const totalPages = Math.ceil(imgHeight / (pageHeight - margin * 2));

      for (let i = 0; i < totalPages; i++) {
        const y = - (pageHeight - margin * 2) * i + margin;
        pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
        if (i < totalPages - 1) pdf.addPage();
      }

      const filename = (scopeName.trim() || 'escopo').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      pdf.save(filename);
      document.body.removeChild(container);
      toast({ title: 'PDF pronto', description: 'PDF profissional gerado.' });
    } catch (err) {
      console.error('Erro ao gerar PDF', err);
      toast({ title: 'Erro ao gerar PDF', description: 'Tente novamente mais tarde.', variant: 'destructive' });
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
                aria-label="Loja"
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
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Preferência de geração pela IA</p>
              <select
                value={aiPreference}
                onChange={e => setAiPreference(e.target.value as 'detail' | 'supplier')}
                aria-label="Preferência de geração pela IA"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground"
              >
                <option value="detail">Detalhar serviço e materiais</option>
                <option value="supplier">Deixar a critério do fornecedor (usar normas)</option>
              </select>
            </div>
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
        <div className="flex gap-2">
          <Button variant="default" onClick={exportToExcel} disabled={isExporting}>
            {isExporting ? 'Gerando planilha…' : 'Exportar para Excel'}
          </Button>
          <Button variant="outline" onClick={exportToPdf} disabled={isExporting}>
            {isExporting ? 'Gerando PDF…' : 'Exportar para PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
