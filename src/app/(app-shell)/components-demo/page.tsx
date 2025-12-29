"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { stores as fallbackStores } from '@/lib/mock-simple';
import { mockIncidents, mockMaintenanceIndicators, mockTechnicians, mockTechnicalReports } from '@/lib/mock-data';

function KanbanDemo() {
  // Use incidents grouped by status as Kanban columns
  const grouped: Record<string, string[]> = { 'A Fazer': [], 'Em Andamento': [], 'Concluído': [] };
  mockIncidents.forEach((inc) => {
    const title = inc.itemName || inc.description || inc.id;
    if (inc.status?.toLowerCase().includes('fechado') || inc.status?.toLowerCase().includes('feito')) grouped['Concluído'].push(title);
    else if (inc.status?.toLowerCase().includes('andamento') || inc.status?.toLowerCase().includes('em andamento')) grouped['Em Andamento'].push(title);
    else grouped['A Fazer'].push(title);
  });
  const [cols, setCols] = useState(grouped);
  function move(from: string, to: string) {
    const item = cols[from][0];
    if (!item) return;
    setCols((c) => ({ ...c, [from]: c[from].slice(1), [to]: [item, ...c[to]] }));
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(cols).map(([k, v]) => (
        <div key={k} className="p-3 border rounded bg-white">
          <div className="font-semibold mb-2">{k}</div>
          <div className="space-y-2">
            {v.map((t, i) => <div key={i} className="p-2 bg-gray-50 border rounded">{t}</div>)}
          </div>
          <div className="mt-3 flex gap-2">
            {Object.keys(cols).filter(x => x!==k).map(x => <button key={x} onClick={() => move(k,x)} className="text-sm px-2 py-1 bg-gray-100 rounded">Mover → {x}</button>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function GanttDemo() {
  // Build tasks from maintenance indicators months
  const tasks = mockMaintenanceIndicators.slice(0, 6).map((m, idx) => ({ id: m.id, title: `Indicador ${m.mes}`, start: `${m.mes}-01`, end: `${m.mes}-28` }));
  const min = new Date(Math.min(...tasks.flatMap(t => [new Date(t.start).getTime(), new Date(t.end).getTime()])));
  const max = new Date(Math.max(...tasks.flatMap(t => [new Date(t.start).getTime(), new Date(t.end).getTime()])));
  const total = Math.max(1, Math.round((max.getTime()-min.getTime())/(1000*60*60*24)));
  return (
    <div className="space-y-3">
      {tasks.map(t => {
        const left = Math.round((new Date(t.start).getTime()-min.getTime())/(1000*60*60*24)/total*100);
        const w = Math.max(5, Math.round((new Date(t.end).getTime()-new Date(t.start).getTime())/(1000*60*60*24)/total*100));
        return (
          <div key={t.id}>
            <div className="text-sm font-medium">{t.title}</div>
            <div className="h-6 bg-gray-100 rounded relative">
              <div className="absolute h-6 bg-indigo-500 rounded" style={{ left: `${left}%`, width: `${w}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdvancedTableDemo() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ name: string; region: string; sales: number }[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/supabase/exports?table=stores_for_geocoding&limit=500');
        if (!res.ok) throw new Error('fetch failed');
        const body = await res.json();
        if (body?.ok && Array.isArray(body.result)) {
          const rows = body.result.map((s: any) => ({ name: s.name || s.store_name || '—', region: s.city || s.location || '—', sales: Math.round(Math.random() * 2000) }));
          if (mounted) setData(rows);
        } else {
          const rows = fallbackStores.map((s: any) => ({ name: s.name || '—', region: s.city || '—', sales: Math.round(Math.random() * 2000) }));
          if (mounted) setData(rows);
        }
      } catch (e) {
        const rows = fallbackStores.map((s: any) => ({ name: s.name || '—', region: s.city || '—', sales: Math.round(Math.random() * 2000) }));
        if (mounted) setData(rows);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const rows = data.filter(r => Object.values(r).join(' ').toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filtrar" className="mb-2 p-1 border rounded" />
      {loading ? <div className="text-sm text-gray-500">Carregando dados reais do Supabase...</div> : null}
      <table className="w-full border-collapse mt-2">
        <thead><tr><th className="text-left">Nome</th><th className="text-left">Região</th><th className="text-left">Vendas</th></tr></thead>
        <tbody>{rows.map((r,i)=>(<tr key={i}><td>{r.name}</td><td>{r.region}</td><td>{r.sales}</td></tr>))}</tbody>
      </table>
    </div>
  );
}

function TimelineDemo() {
  const events = mockIncidents.slice(0, 8).map((i) => ({ id: i.id, date: i.openedAt || new Date().toISOString(), title: i.itemName || i.description }));
  return (
    <div className="space-y-3">
      {events.map(e => (
        <div key={e.id} className="flex gap-3 items-start">
          <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1" />
          <div>
            <div className="text-sm text-gray-500">{new Date(e.date).toLocaleDateString()}</div>
            <div className="font-medium">{e.title}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrgChartDemo() {
  const root = { name: mockTechnicians[0]?.name ?? 'CEO', title: mockTechnicians[0]?.role ?? 'Diretor', children: mockTechnicians.slice(1, 4).map(t => ({ name: t.name, title: t.role })) };
  return (
    <div className="p-3 border rounded bg-white">
      <div className="font-medium">{root.name} — <span className="text-sm text-gray-500">{root.title}</span></div>
      <div className="mt-2 pl-4 border-l">
        {root.children.map((c,i)=>(<div key={i} className="p-2 border rounded bg-gray-50">{c.name} — <span className="text-sm text-gray-500">{c.title}</span></div>))}
      </div>
    </div>
  );
}

function HeatmapDemo() {
  const vals = mockMaintenanceIndicators.slice(0, 10).map(m => m.backlog ?? 0);
  const max = Math.max(...vals, 1);
  return (
    <div className="grid grid-cols-5 gap-1">
      {vals.map((v,i)=>(<div key={i} className="h-12 flex items-center justify-center text-white rounded" style={{background:`rgb(${Math.round(255*(v/max))},${Math.round(200*(1-v/max))},100)`}}>{v}</div>))}
    </div>
  );
}

function WizardDemo() {
  const steps = ['Dados', 'Preferências', 'Finalizar'];
  const [i,setI] = useState(0);
  return (
    <div className="p-4 border rounded bg-white space-y-3">
      <div className="text-sm text-gray-500">Etapa {i+1} de {steps.length}</div>
      <div className="font-medium">{steps[i]}</div>
      <div className="flex gap-2">
        <button disabled={i===0} onClick={()=>setI(s=>s-1)} className="px-3 py-1 bg-gray-100 rounded">Voltar</button>
        {i<steps.length-1 ? <button onClick={()=>setI(s=>s+1)} className="px-3 py-1 bg-indigo-600 text-white rounded">Próxima</button> : <button onClick={()=>alert('Concluído')} className="px-3 py-1 bg-green-600 text-white rounded">Concluir</button>}
      </div>
    </div>
  );
}

export default function ComponentsDemoPage() {
  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <header>
        <h1 className="text-2xl font-semibold">Demonstração de Componentes</h1>
        <p className="text-sm text-gray-500">Exemplos interativos dos componentes solicitados.</p>
      </header>
      <section className="grid grid-cols-1 gap-6 items-start">
        <div className="p-4 border rounded bg-white min-h-[220px] flex flex-col">
          <h3 className="font-semibold mb-2">Quadro Kanban</h3>
          <div className="flex-1 overflow-auto"><KanbanDemo /></div>
        </div>

        <div className="p-4 border rounded bg-white min-h-[220px] flex flex-col">
          <h3 className="font-semibold mb-2">Gráfico de Gantt</h3>
          <div className="flex-1 overflow-auto"><GanttDemo /></div>
        </div>

        <div className="p-4 border rounded bg-white min-h-[220px] flex flex-col">
          <h3 className="font-semibold mb-2">Tabela de Dados Avançada</h3>
          <div className="flex-1 overflow-auto"><AdvancedTableDemo /></div>
        </div>

        <div className="p-4 border rounded bg-white min-h-[220px] flex flex-col">
          <h3 className="font-semibold mb-2">Linha do Tempo</h3>
          <div className="flex-1 overflow-auto"><TimelineDemo /></div>
        </div>

        <div className="p-4 border rounded bg-white min-h-[220px] flex flex-col">
          <h3 className="font-semibold mb-2">Organograma</h3>
          <div className="flex-1 overflow-auto"><OrgChartDemo /></div>
        </div>

        <div className="p-4 border rounded bg-white min-h-[220px] flex flex-col">
          <h3 className="font-semibold mb-2">Mapa de Calor</h3>
          <div className="flex-1 overflow-auto"><HeatmapDemo /></div>
        </div>

        <div className="col-span-1 p-4 border rounded bg-white min-h-[160px]">
          <h3 className="font-semibold mb-2">Assistente (Wizard)</h3>
          <WizardDemo />
        </div>
      </section>

      <div>
        <Link href="/" className="text-sm text-indigo-600">Voltar ao Painel</Link>
      </div>
    </div>
  );
}
