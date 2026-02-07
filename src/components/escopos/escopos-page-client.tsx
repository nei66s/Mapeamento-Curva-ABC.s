"use client";

import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
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
  const { user: currentUser } = useCurrentUser();
  const [items, setItems] = useState<ScopeItem[]>([createEmptyItem()]);
  const [attachments, setAttachments] = useState<{ id: string; file: File; url: string }[]>([]);
  const [improvingItemId, setImprovingItemId] = useState<string | null>(null);
  const [improvingScope, setImprovingScope] = useState(false);
  const [scopeImproved, setScopeImproved] = useState(false);
  // A geração pela IA deve sempre aplicar as normas ABNT
  const [isExporting, setIsExporting] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [loadingStores, setLoadingStores] = useState(true);
  const [bulkImproving, setBulkImproving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [generatingItems, setGeneratingItems] = useState(false);

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

  useEffect(() => {
    if (!currentUser) return;
    // Populate requester with logged user's name only if the field is empty
    setRequester(prev => (prev && prev.trim()) ? prev : (currentUser.name || ''));
  }, [currentUser]);

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

  const preferenceText = 'Aplicar normas ABNT onde aplicável.';

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
      // Request the improved scope written objectively for the contractor:
      // - Use concise, directive language (imperative or short indicative sentences)
      // - Don't write from the engineer's perspective (no "Como engenheiro...")
      // - Keep it focused on the service the third party must execute
      // - Mention cleaning, waste disposal and reference ABNT when applicable
      const improved = await improveScopeText({
        text: scopeDescription,
        context: `${scopeContext} \nInstruções de estilo: escreva o texto direcionado ao executor/fornecedor em voz imperativa ou frases curtas indicativas. Evite primeira pessoa; não comece com "Como engenheiro". Seja objetivo e inclua limpeza e destinação de resíduos, além de referência às normas ABNT quando aplicável.`,
        tone,
        preferenceText,
      });
      setScopeDescription(improved);
      setScopeImproved(true);
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

  const generateItemsFromScope = async () => {
    if (!scopeDescription.trim()) {
      toast({ title: 'Descrição vazia', description: 'Melhore a descrição com IA antes de gerar itens.', variant: 'destructive' });
      return;
    }
    setGeneratingItems(true);
    try {
      const payload = {
        messages: [
          {
            role: 'user',
            content: `Você é um assistente técnico. A partir da descrição do escopo abaixo, gere SOMENTE uma lista numerada de itens de alto nível para o escopo. Regras estritas:\n- Responda apenas com a lista numerada (uma linha por item).\n- Cada item: título conciso (verbo no infinitivo + complemento), até 5 palavras.\n- Seja o mais resumido possível, agrupe subatividades em descrições de item em vez de criar itens separados.\n- Não escreva parágrafos, explicações, perguntas ou observações extras.\n- Não repita a descrição do escopo.\n- Gere entre 2 e 6 itens, priorizando agrupamento e clareza (ex.: fabricação, desmontagem, montagem).\n\nPreferência: ${preferenceText} (incluir referência às normas ABNT quando aplicável)\n\nDescrição do escopo:\n${scopeDescription}`,
          },
        ],
      };
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Erro ao gerar itens');
      const text = String(data.result || data?.result || data?.text || '').trim();
      if (!text) throw new Error('Resposta vazia do AI');
      let lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // If AI returned a single long paragraph, attempt to split into sentences/clauses
      if (lines.length === 1 && lines[0].length > 120) {
        const trySplit = lines[0].split(/[\.;]\s+|\n+/).map(s => s.trim()).filter(Boolean);
        if (trySplit.length > 1 && trySplit.every(s => s.length < 200)) {
          lines = trySplit;
        }
      }
      const cleaned = lines
        .map(l => {
          let t = l.replace(/^\s*\d+[\)\.\-\s]*/, '').replace(/^[\-\*\u2022]\s*/, '').trim();
          if (/^\d+$/.test(t)) return '';
          return t;
        })
        .map(s => s.trim())
        .filter(Boolean);
      const entries = cleaned.map(title => ({ ...createEmptyItem(), title }));
      setItems(prev => {
        const isOnlyEmptyItem = prev.length === 1 && prev[0].title.trim() === '' && prev[0].description.trim() === '' && prev[0].checklist.length === 0;
        return isOnlyEmptyItem ? entries : [...prev, ...entries];
      });
      // Generate descriptions for the created entries (same behavior as import + IA)
      // Filter out titles that are too short before requesting descriptions
      const validEntries = entries.filter(e => (e.title || '').trim().length >= 3);
      if (validEntries.length > 0) {
        try {
          await generateDescriptionsForImportedItems(validEntries);
          toast({ title: 'Itens gerados', description: `${entries.length} item(s) adicionados com descrições (alguns podem ter sido ignorados).` });
        } catch (e) {
          toast({ title: 'Itens gerados', description: `${entries.length} item(s) adicionados (sem descrições).` });
        }
      } else {
        toast({ title: 'Itens gerados', description: `${entries.length} item(s) adicionados (nenhum título válido para gerar descrições).` });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao gerar itens', description: String(err?.message || err), variant: 'destructive' });
    } finally {
      setGeneratingItems(false);
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
    const t = (title || '').trim();
    if (t.length < 3) {
      // Fallback heuristic for very short titles to avoid schema validation errors
      return `${t} — descrição técnica a ser detalhada pelo fornecedor.`;
    }
    // Request a concise, action-oriented description for the supplier:
    // - Prefer imperative or short indicative sentences
    // - Include recommended materials, basic test/acceptance, limpeza e destinação de resíduos
    // - Cite normas ABNT aplicáveis quando relevantes
    const response = await fetch('/api/ai/generate-scope-item-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: t,
        context: `${scopeContext} \nInstruções: gere uma descrição curta e direta, em voz imperativa (ex.: "Fabricar portas corta-fogo...", "Desmontar a porta existente..."). Inclua materiais recomendados, procedimentos de limpeza e destinação de resíduos, e referências às normas ABNT quando aplicável. Agrupe subatividades na descrição, não crie itens separados para cada detalhe.`,
        tone,
        preferenceText,
      }),
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

  const handleAddAttachments = (event: any) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const newAtt = files.map(f => ({ id: createId(), file: f, url: URL.createObjectURL(f) }));
    setAttachments(prev => [...prev, ...newAtt]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const found = prev.find(a => a.id === id);
      if (found) {
        try { URL.revokeObjectURL(found.url); } catch (e) {}
      }
      return prev.filter(a => a.id !== id);
    });
  };

  useEffect(() => {
    return () => {
      attachments.forEach(a => {
        try { URL.revokeObjectURL(a.url); } catch (e) {}
      });
    };
    // We intentionally include attachments so cleanup runs on unmount and when attachments change
  }, [attachments]);

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
      const companyName = 'Supermercados Pague Menos';
      const now = new Date();
      const titleRow = [`${companyName} — ${now.toLocaleString()}`];

      const tableRows = [
        headerRow,
        ...items.map((item, index) => [
          index + 1,
          item.title,
          item.description,
          item.checklist.filter(Boolean).join('\n'),
          '',
        ]),
      ];
      const attachmentRows: any[] = [];
      if (attachments && attachments.length) {
        attachmentRows.push([]);
        attachmentRows.push(['Anexos e fotos']);
        attachments.forEach(a => {
          attachmentRows.push([a.file?.name || 'Anexo']);
        });
      }

      const sheetRows = [titleRow, ...metadataRows, ...tableRows, ...attachmentRows];
      const worksheet = utils.aoa_to_sheet(sheetRows);

      worksheet['!cols'] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 50 },
        { wch: 35 },
        { wch: 20 },
      ];

      const headerHex = '#1F2937';
      const headerRgb = 'FF' + headerHex.replace('#', '').toUpperCase();
      const headerStyle = {
        font: { bold: true, color: { rgb: 'FFFFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: headerRgb } },
        alignment: { horizontal: 'center', vertical: 'center' },
      } as any;
      const metadataStyle = {
        font: { bold: true, color: { rgb: 'FF111827' } },
      } as any;

      const headerRowIndex = 1 + metadataRows.length;

      headerRow.forEach((_, colIndex) => {
        const cell = worksheet[utils.encode_cell({ r: headerRowIndex, c: colIndex })];
        if (cell) {
          cell.s = { ...(cell.s || {}), ...headerStyle } as any;
          cell.s.border = cell.s.border || {
            top: { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left: { style: 'thin', color: { rgb: 'FF000000' } },
            right: { style: 'thin', color: { rgb: 'FF000000' } },
          };
        }
      });

      metadataRows.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          const cell = worksheet[utils.encode_cell({ r: rowIndex, c: colIndex })];
          if (cell && value) {
            cell.s = { ...(cell.s || {}), ...metadataStyle } as any;
          }
        });
      });

      try {
        const titleCellRef = utils.encode_cell({ r: 0, c: 0 });
        const titleCell = worksheet[titleCellRef];
        if (titleCell) {
          titleCell.t = 's';
          titleCell.v = `${companyName} — ${new Date().toLocaleString()}`;
          titleCell.s = titleCell.s || {};
          titleCell.s.font = { bold: true, sz: 14, color: { rgb: 'FF111827' } };
          titleCell.s.alignment = { horizontal: 'left', vertical: 'center' };
        }
        worksheet['!merges'] = worksheet['!merges'] || [];
        worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } });
      } catch (e) {}

      const startDataRow = headerRowIndex + 1;
      const endDataRow = startDataRow + items.length - 1;
      for (let r = startDataRow; r <= endDataRow; r++) {
        const descCell = worksheet[utils.encode_cell({ r, c: 2 })];
        if (descCell) {
          descCell.s = descCell.s || {};
          descCell.s.alignment = { wrapText: true, vertical: 'top' };
        }
        const checklistCell = worksheet[utils.encode_cell({ r, c: 3 })];
        if (checklistCell) {
          checklistCell.s = checklistCell.s || {};
          checklistCell.s.alignment = { wrapText: true, vertical: 'top' };
        }
        const valorRef = utils.encode_cell({ r, c: 4 });
        const valorCell = worksheet[valorRef];
        if (valorCell) {
          if (valorCell.v === '' || valorCell.v == null) {
            valorCell.v = 0;
            valorCell.t = 'n';
          }
          valorCell.z = valorCell.z || 'R$#,##0.00';
          valorCell.s = valorCell.s || {};
          valorCell.s.numFmt = valorCell.s.numFmt || 'R$#,##0.00';
        }
      }

      try {
        const filterRange = utils.encode_range({ s: { r: headerRowIndex, c: 0 }, e: { r: endDataRow, c: headerRow.length - 1 } });
        worksheet['!autofilter'] = { ref: filterRange };
      } catch (e) {}
      const totalRow = endDataRow + 1;
      const totalLabelCellRef = utils.encode_cell({ r: totalRow, c: 3 });
      worksheet[totalLabelCellRef] = { t: 's', v: 'Total', s: { font: { bold: true } } } as any;
      const sumFormula = `SUM(E${startDataRow + 1}:E${endDataRow + 1})`;
      const totalValueCellRef = utils.encode_cell({ r: totalRow, c: 4 });
      worksheet[totalValueCellRef] = { t: 'n', f: sumFormula, z: 'R$#,##0.00' } as any;

      const workbook = utils.book_new();
      try {
        (workbook as any).Workbook = (workbook as any).Workbook || {};
        (workbook as any).Workbook.Views = (workbook as any).Workbook.Views || [];
        (workbook as any).Workbook.Views.push({ ySplit: headerRowIndex + 1, activeTab: 0 });
      } catch (e) {}
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

      // Header with logo and title
      const headerRow = document.createElement('div');
      headerRow.style.display = 'flex';
      headerRow.style.alignItems = 'center';
      headerRow.style.gap = '12px';
      headerRow.style.marginBottom = '8px';

      const logoImg = document.createElement('img');
      logoImg.src = '/logo.png';
      logoImg.style.width = '90px';
      logoImg.style.height = 'auto';
      logoImg.style.objectFit = 'contain';
      headerRow.appendChild(logoImg);

      const title = document.createElement('h2');
      title.innerText = 'Supermercados Pague Menos — ' + new Date().toLocaleString();
      title.style.margin = '0';
      title.style.fontSize = '20px';
      title.style.fontWeight = '700';
      title.style.textTransform = 'capitalize';
      headerRow.appendChild(title);
      container.appendChild(headerRow);

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
        th.style.background = '#FF7A00';
        th.style.color = '#fff';
        th.style.padding = '8px';
        th.style.border = '1px solid #ddd';
        th.style.textAlign = 'left';
        hrow.appendChild(th);
      });
      // attachments will be rendered after the table in a dedicated section
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

      // Append attachments in a dedicated "Anexos e fotos" section at the end
      if (attachments && attachments.length) {
        const annexTitle = document.createElement('h3');
        annexTitle.innerText = 'Anexos e fotos';
        annexTitle.style.margin = '12px 0 8px 0';
        annexTitle.style.fontSize = '14px';
        annexTitle.style.fontWeight = '700';
        container.appendChild(annexTitle);

        const attWrap = document.createElement('div');
        attWrap.style.display = 'flex';
        attWrap.style.gap = '8px';
        attWrap.style.flexWrap = 'wrap';
        attachments.forEach(a => {
          try {
            const holder = document.createElement('div');
            holder.style.display = 'flex';
            holder.style.flexDirection = 'column';
            holder.style.alignItems = 'center';
            holder.style.width = '140px';

            const img = document.createElement('img');
            img.src = a.url;
            img.style.width = '120px';
            img.style.height = '120px';
            img.style.objectFit = 'cover';
            img.style.border = '1px solid #eee';
            img.style.borderRadius = '6px';
            holder.appendChild(img);

            const label = document.createElement('div');
            label.innerText = a.file?.name || '';
            label.style.fontSize = '11px';
            label.style.marginTop = '6px';
            label.style.textAlign = 'center';
            label.style.maxWidth = '120px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.whiteSpace = 'nowrap';
            holder.appendChild(label);

            attWrap.appendChild(holder);
          } catch (e) {}
        });
        container.appendChild(attWrap);
      }

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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImproveScope}
                  disabled={!scopeDescription.trim() || improvingScope}
                >
                  {improvingScope ? 'Melhorando…' : 'Melhorar com IA'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={generateItemsFromScope}
                  disabled={!scopeImproved || improvingScope || generatingItems}
                >
                  {generatingItems ? 'Gerando itens…' : 'Gerar itens'}
                </Button>
              </div>
            </div>
            <Textarea
              value={scopeDescription}
              onChange={event => setScopeDescription(event.target.value)}
              placeholder="Detalhe o objetivo, os limites e o resultado esperado do escopo."
            />
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Anexar fotos (opcional)</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAddAttachments}
                className="mt-1"
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {attachments.map(a => (
                  <div key={a.id} className="relative">
                    <img src={a.url} alt="anexo" className="h-24 w-24 object-cover rounded-md border" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(a.id)}
                      aria-label="Remover anexo"
                      className="absolute -top-2 -right-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Exportar</p>
            <p className="text-xs text-muted-foreground">Gere uma planilha ou PDF com o escopo atual.</p>
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
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setItems(prev => [...prev, createEmptyItem()])}>
              Adicionar item
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const wants = typeof window !== 'undefined' ? window.confirm('Remover todos os itens do escopo?') : false;
                if (wants) setItems([createEmptyItem()]);
              }}
            >
              Remover todos
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Use "Adicionar item" para inserir tarefas ou gere itens a partir da descrição com IA.</p>
        </CardFooter>
      </Card>
 

      
    </div>
  );
}
