"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { AssetRecord, AssetInsumo, AssetComponente } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type AssetFormState = {
  storeId: string;
  storeName: string;
  storeIdLocked?: boolean;
  locationGroup: string;
  locationDetail: string;
  name: string;
  patrimony: string;
  description: string;
  complexity: string;
  costEstimate: string;
  riskNotes: string;
  insumos: AssetInsumo[];
  componentes: AssetComponente[];
};

const emptyInsumo: AssetInsumo = {
  name: '',
  description: '',
  quantity: 1,
  safetyStock: false,
  stockLocation: '',
};

const emptyComponente: AssetComponente = {
  name: '',
  description: '',
  maintenanceComplexity: '',
  costEstimate: '',
  stockAvailable: true,
  criticality: 'Média',
};

const initialFormState: AssetFormState = {
  storeId: '',
  storeName: '',
  locationGroup: '',
  locationDetail: '',
  name: '',
  patrimony: '',
  description: '',
  complexity: '',
  costEstimate: '',
  riskNotes: '',
  insumos: [],
  componentes: [],
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [form, setForm] = useState<AssetFormState>(initialFormState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [componentInsights, setComponentInsights] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();

  const groupedAssets = useMemo(() => {
    const map = new Map<string, AssetRecord[]>();
    assets.forEach(asset => {
      const key = asset.storeName || 'Sem loja';
      const bucket = map.get(key) ?? [];
      bucket.push(asset);
      map.set(key, bucket);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [assets]);

  const parentHierarchy = useMemo(() => {
    const map = new Map<string, AssetRecord[]>();
    assets.forEach(asset => {
      const parent = asset.hierarchy?.split('>')[0].trim() || 'Sem hierarquia definida';
      const bucket = map.get(parent) ?? [];
      bucket.push(asset);
      map.set(parent, bucket);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [assets]);

  const hierarchyGroups = useMemo(() => {
    const groups = new Set<string>();
    assets.forEach(asset => {
      const [group] = asset.hierarchy?.split('>') ?? [];
      const name = group?.trim();
      if (name) groups.add(name);
    });
    return Array.from(groups).sort();
  }, [assets]);

  useEffect(() => {
    refreshAssets();
    refreshStores();
  }, []);

  const refreshStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (!res.ok) throw new Error('Não foi possível carregar as lojas');
      const data = await res.json();
      setStores(data);
    } catch (err) {
      console.error(err);
    }
  };

  async function refreshAssets() {
    try {
      const res = await fetch('/api/assets');
      if (!res.ok) throw new Error('Não foi possível carregar os ativos');
      const data: AssetRecord[] = await res.json();
      setAssets(data);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível carregar os ativos.' });
    }
  }

  const handleFormChange = (field: keyof AssetFormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddInsumo = () => {
    setForm(prev => ({ ...prev, insumos: [...prev.insumos, { ...emptyInsumo }] }));
  };

  const handleAddComponente = () => {
    setForm(prev => ({ ...prev, componentes: [...prev.componentes, { ...emptyComponente }] }));
  };

  const handleResetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setComponentInsights('');
    setAiMessage(null);
  };

  const handleUpdateInsumo = (index: number, field: keyof AssetInsumo, value: any) => {
    setForm(prev => {
      const next = [...prev.insumos];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, insumos: next };
    });
  };

  const handleUpdateComponente = (index: number, field: keyof AssetComponente, value: any) => {
    setForm(prev => {
      const next = [...prev.componentes];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, componentes: next };
    });
  };

  const handleRemoveInsumo = (index: number) => {
    setForm(prev => {
      const next = [...prev.insumos];
      next.splice(index, 1);
      return { ...prev, insumos: next };
    });
  };

  const handleRemoveComponente = (index: number) => {
    setForm(prev => {
      const next = [...prev.componentes];
      next.splice(index, 1);
      return { ...prev, componentes: next };
    });
  };

  const resolveHierarchy = (state: AssetFormState) => {
    if (!state.locationGroup) return undefined;
    return state.locationDetail ? `${state.locationGroup} > ${state.locationDetail}` : state.locationGroup;
  };

  const handleLoadAsset = (asset: AssetRecord) => {
    const [groupRaw, detailRaw] = (asset.hierarchy || '').split('>').map(part => part.trim());
    setEditingId(asset.id);
    setForm({
      storeId: asset.storeId || '',
      storeName: asset.storeName,
      locationGroup: groupRaw || '',
      locationDetail: detailRaw || '',
      name: asset.name,
      patrimony: asset.patrimony || '',
      description: asset.description || '',
      complexity: asset.complexity || '',
      costEstimate: asset.costEstimate || '',
      riskNotes: asset.riskNotes || '',
      insumos: asset.insumos,
      componentes: asset.componentes,
    });
    setComponentInsights(asset.description || '');
    setAiMessage('Carregado para edição');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAsset = async () => {
    if (!form.name || !form.storeName) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha o nome do ativo e a loja.' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        storeId: form.storeId || undefined,
        storeName: form.storeName,
        name: form.name,
        patrimony: form.patrimony || undefined,
        hierarchy: resolveHierarchy(form) || undefined,
        description: form.description || undefined,
        complexity: form.complexity || undefined,
        costEstimate: form.costEstimate || undefined,
        riskNotes: form.riskNotes || undefined,
        insumos: form.insumos.filter(item => item.name.trim()),
        componentes: form.componentes.filter(item => item.name.trim()),
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = '/api/assets';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Falha ao salvar o ativo.');
      }

      await refreshAssets();
      toast({
        title: editingId ? 'Atualizado' : 'Criado',
        description: `O ativo "${form.name}" foi ${editingId ? 'atualizado' : 'criado'} com sucesso.`,
      });
      handleResetForm();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível salvar o ativo.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!form.name) {
      toast({ title: 'Ativo obrigatório', description: 'Informe o nome do ativo para gerar insumos e componentes.' });
      return;
    }
    setAiLoading(true);
    setAiMessage(null);
    try {
      const res = await fetch('/api/assets/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetName: form.name,
          storeName: form.storeName,
          patrimony: form.patrimony,
          hierarchy: resolveHierarchy(form),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro na geração automática.');
      setForm(prev => ({
        ...prev,
        insumos: data.insumos.map((item: any) => ({
          ...emptyInsumo,
          ...item,
          quantity: item.quantity ?? emptyInsumo.quantity,
          safetyStock: item.safetyStock ?? false,
        })),
        componentes: data.componentes.map((item: any) => ({
          ...emptyComponente,
          ...item,
          criticality: item.criticality ?? 'Média',
          stockAvailable: item.stockAvailable ?? true,
        })),
      }));
      setComponentInsights(data.componentInsights || '');
      setAiMessage('Metadados atualizados com IA.');
    } catch (err: any) {
      console.error(err);
      setAiMessage(String(err?.message ?? 'Não foi possível gerar metadados.'));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8 pb-16">
      <PageHeader
        title="Controle de Ativos e Componentes"
        description="Cadastre ativos por loja, associe insumos e componentes, registre patrimônio e mantenha a hierarquia pronta para o futuro PM."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateMetadata} disabled={aiLoading}>
            {aiLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {aiLoading ? 'IA em execução' : 'Completar insumos + componentes'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleResetForm} disabled={aiLoading || isSaving}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Limpar formulário
          </Button>
        </div>
      </PageHeader>

      {aiMessage && (
        <Alert>
          <AlertTitle>Status da IA</AlertTitle>
          <AlertDescription>{aiMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ficha do ativo</CardTitle>
          <CardDescription>
            Informe loja, nome, patrimônio e hierarquia para que o ativo esteja pronto para ser sincronizado com o futuro PM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="storeName">Loja / Unidade</Label>
              <select
                id="storeName"
                title="Loja / Unidade"
                aria-label="Loja / Unidade"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={form.storeId || ''}
                onChange={event => {
                  const selectedId = event.target.value;
                  const selectedStore = stores.find(store => store.id === selectedId);
                  setForm(prev => ({
                    ...prev,
                    storeId: selectedId,
                    storeName: selectedStore?.name ?? '',
                  }));
                }}
              >
                <option value="">Selecione uma loja existente</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Cadastre novas lojas via <a className="font-semibold text-primary" href="/stores">Lojas</a>.
              </p>
            </div>
            <div>
              <Label htmlFor="storeId">Código da loja (opcional)</Label>
              <Input
                id="storeId"
                placeholder="Ex: LOJA-001"
                value={form.storeId}
                onChange={event => handleFormChange('storeId', event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="assetName">Nome do ativo</Label>
              <Input
                id="assetName"
                placeholder="Ex: Masseira industrial A"
                value={form.name}
                onChange={event => handleFormChange('name', event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="patrimony">Patrimônio</Label>
              <Input
                id="patrimony"
                placeholder="Ex: PAT-1234"
                value={form.patrimony}
                onChange={event => handleFormChange('patrimony', event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="locationGroup">Grupo de hierarquia</Label>
              <input
                id="locationGroup"
                list="hierarchy-groups"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Escolha ou digite um grupo existente"
                value={form.locationGroup}
                onChange={event => handleFormChange('locationGroup', event.target.value)}
              />
              <datalist id="hierarchy-groups">
                {hierarchyGroups.map(group => (
                  <option key={group} value={group} />
                ))}
              </datalist>
              <p className="mt-2 text-xs text-muted-foreground">
                Utilize um grupo já cadastrado para evitar duplicidades ou adicione um novo nome autorizado pela operação.
              </p>
            </div>
            <div>
              <Label htmlFor="locationDetail">Localização específica</Label>
              <Input
                id="locationDetail"
                placeholder="Ex: Linha de panificação / Setor Mecânico"
                value={form.locationDetail}
                onChange={event => handleFormChange('locationDetail', event.target.value)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Informe detalhes (setor, sala, área) para refinar o mapeamento.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="complexity">Complexidade da manutenção</Label>
              <Input
                id="complexity"
                placeholder="Ex: Alta - requer equipe especializada"
                value={form.complexity}
                onChange={event => handleFormChange('complexity', event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="costEstimate">Custo estimado</Label>
              <Input
                id="costEstimate"
                placeholder="Ex: Médio, média mensal de R$ 1.200"
                value={form.costEstimate}
                onChange={event => handleFormChange('costEstimate', event.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="riskNotes">Observações do risco/patrimônio</Label>
            <Textarea
              id="riskNotes"
              rows={2}
              placeholder="Registre se o ativo é crítico, raro ou precisa de seguro especial."
              value={form.riskNotes}
              onChange={event => handleFormChange('riskNotes', event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <Switch
              id="informais"
              checked={form.description.length > 0}
              onCheckedChange={() => {
                if (!form.description) {
                  handleFormChange('description', 'Descrição inicial disponível');
                }
              }}
            />
            <Label htmlFor="informais">Descrição livre armazenada (opcional)</Label>
          </div>
          <div className="grid gap-4">
            <Label htmlFor="description">Descrição do ativo</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Explique a função e os principais responsáveis."
              value={form.description}
              onChange={event => handleFormChange('description', event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleSaveAsset}
              disabled={isSaving}
            >
              {isSaving ? 'Gravando...' : editingId ? 'Atualizar ativo' : 'Salvar ativo'}
            </Button>
            {editingId && (
              <Button variant="ghost" onClick={handleResetForm}>
                <Trash2 className="mr-2 h-4 w-4" />
                Cancelar edição
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hierarquia Pai</CardTitle>
          <CardDescription>Visão geral das hierarquias agrupadas e quantos ativos pertencem a cada nível pai.</CardDescription>
        </CardHeader>
        <CardContent>
          {parentHierarchy.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma hierarquia cadastrada ainda.</p>
          ) : (
            <div className="space-y-2">
              {parentHierarchy.map(([parent, assets]) => (
                <div key={parent} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-3">
                  <Badge variant="secondary" className="text-xs">
                    {assets.length} ativos
                  </Badge>
                  <div>
                    <p className="font-semibold">{parent}</p>
                    <p className="text-xs text-muted-foreground">
                      {assets.map(asset => asset.name).join(' • ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insumos vinculados</CardTitle>
          <CardDescription>Liste os insumos necessários e marque se precisam ficar em estoque de segurança.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="ghost" size="sm" onClick={handleAddInsumo}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar insumo
            </Button>
          </div>
          <div className="space-y-3">
            {form.insumos.map((insumo, index) => (
              <div key={`insumo-${index}`} className="grid gap-3 rounded-lg border border-primary/10 p-4 md:grid-cols-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Nome do insumo</Label>
                  <Input
                    placeholder="Ex: Ingrediente X"
                    value={insumo.name}
                    onChange={event => handleUpdateInsumo(index, 'name', event.target.value)}
                  />
                  <Label className="mt-2">Descrição</Label>
                  <Textarea
                    rows={2}
                    value={insumo.description || ''}
                    onChange={event => handleUpdateInsumo(index, 'description', event.target.value)}
                    placeholder="Explique o papel do insumo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade padrão</Label>
                  <Input
                    type="number"
                    min={0}
                    value={insumo.quantity ?? 0}
                    onChange={event => handleUpdateInsumo(index, 'quantity', Number(event.target.value))}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(insumo.safetyStock)}
                      onCheckedChange={value => handleUpdateInsumo(index, 'safetyStock', value)}
                    />
                    <Label>Estoque de segurança?</Label>
                  </div>
                  <Label>Local do estoque</Label>
                  <Input
                    placeholder="Ex: Almoxarifado principal"
                    value={insumo.stockLocation || ''}
                    onChange={event => handleUpdateInsumo(index, 'stockLocation', event.target.value)}
                  />
                </div>
                <div className="flex flex-col items-end justify-between">
                  <Badge variant="secondary" className="px-2 py-1 text-xs">
                    {insumo.safetyStock ? 'Estoque crítico' : 'Uso regular'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveInsumo(index)} title="Remover insumo">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Componentes e submontagens</CardTitle>
          <CardDescription>Capture peças críticas, complexidade e custo. A IA pode preencher tudo automaticamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="ghost" size="sm" onClick={handleAddComponente}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar componente
            </Button>
          </div>
          <div className="space-y-3">
            {form.componentes.map((componente, index) => (
              <div key={`comp-${index}`} className="grid gap-3 rounded-lg border border-primary/10 p-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Ex: Motor principal"
                    value={componente.name}
                    onChange={event => handleUpdateComponente(index, 'name', event.target.value)}
                  />
                  <Label className="mt-2">Descrição</Label>
                  <Textarea
                    rows={2}
                    value={componente.description || ''}
                    onChange={event => handleUpdateComponente(index, 'description', event.target.value)}
                    placeholder="Qual a função e criticidade?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complexidade de manutenção</Label>
                  <Input
                    value={componente.maintenanceComplexity || ''}
                    onChange={event => handleUpdateComponente(index, 'maintenanceComplexity', event.target.value)}
                    placeholder="Ex: Requer desmontagem completa"
                  />
                  <Label>Custo estimado</Label>
                  <Input
                    value={componente.costEstimate || ''}
                    onChange={event => handleUpdateComponente(index, 'costEstimate', event.target.value)}
                    placeholder="Ex: Substituição ~R$ 2.000"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(componente.stockAvailable)}
                      onCheckedChange={value => handleUpdateComponente(index, 'stockAvailable', value)}
                    />
                    <Label>Estoque disponível?</Label>
                  </div>
                  <div>
                    <Label>Criticidade</Label>
                    <Input
                      value={componente.criticality || ''}
                      onChange={event => handleUpdateComponente(index, 'criticality', event.target.value as any)}
                      placeholder="Baixa / Média / Alta / Crítica"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveComponente(index)} title="Remover componente">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {componentInsights && (
            <Alert>
              <AlertTitle>Insights de IA</AlertTitle>
              <AlertDescription>{componentInsights}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ativos cadastrados</CardTitle>
          <CardDescription>Organizados por loja. Clique em um ativo para carregar os dados no formulário.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedAssets.length === 0 && (
            <Alert>
              <AlertTitle>Sem ativos cadastrados</AlertTitle>
              <AlertDescription>Cadastre o primeiro ativo para começar a organizar insumos e componentes.</AlertDescription>
            </Alert>
          )}
          {groupedAssets.map(([storeName, storeAssets]) => (
            <Accordion key={storeName} type="single" collapsible className="border">
              <AccordionItem value={storeName}>
                <AccordionTrigger className="text-lg font-semibold">
                  {storeName} ({storeAssets.length} ativos)
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  {storeAssets.map(asset => (
                    <Card key={asset.id} className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <CardTitle>{asset.name}</CardTitle>
                            <CardDescription>Patrimônio: {asset.patrimony || 'sem código'}</CardDescription>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleLoadAsset(asset)}>
                            Carregar no formulário
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span>Hierarquia: {asset.hierarchy || '—'}</span>
                          <span>Complexidade: {asset.complexity || '—'}</span>
                          <span>Custo: {asset.costEstimate || '—'}</span>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Componentes</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {asset.componentes.map(component => (
                                <TooltipProvider key={component.name}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-xs">
                                        {component.name}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{component.description}</p>
                                      <p className="text-xs text-muted-foreground">
                                        Complexidade: {component.maintenanceComplexity}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insumos</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {asset.insumos.map(insumo => (
                                <Badge key={insumo.name} variant="secondary" className="text-xs">
                                  {insumo.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
