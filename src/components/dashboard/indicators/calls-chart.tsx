
"use client";

import React from 'react';
import { Area, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, LabelList, ReferenceLine, ReferenceDot } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { MaintenanceIndicator } from "@/lib/types";

interface CallsChartProps {
    data: MaintenanceIndicator[];
    selectedMonth?: string;
}

const chartConfig = {
  abertos: {
    label: "Abertos",
    color: "#2563EB", // blue-600
  },
  solucionados: {
    label: "Solucionados",
    color: "#16A34A", // green-600
  },
  backlog: {
    label: "Backlog",
    color: "#F59E0B", // amber-500
  },
};

export function CallsChart({ data, selectedMonth }: CallsChartProps) {
  const [visible, setVisible] = React.useState({ abertos: true, solucionados: true, backlog: true });

  const chartData = data.map(item => ({
    mes: item.mes,
    name: new Date(`${item.mes}-02`).toLocaleString('default', { month: 'short' }),
    abertos: item.chamados_abertos,
    solucionados: -item.chamados_solucionados,
    backlog: item.backlog,
  }));

  const years = Array.from(new Set(chartData.map(d => d.mes.split('-')[0]))).sort((a,b) => Number(b) - Number(a));
  const defaultYear = selectedMonth ? selectedMonth.split('-')[0] : (years[0] || String(new Date().getFullYear()));
  const [selectedYear, setSelectedYear] = React.useState<string>(defaultYear);

  const filteredData = selectedYear === 'all' ? chartData : chartData.filter(d => d.mes.startsWith(selectedYear));

  const maxAbertos = filteredData.length ? Math.max(...filteredData.map(d => d.abertos)) : 0;
  const minAbertos = filteredData.length ? Math.min(...filteredData.map(d => d.abertos)) : 0;

  const solucionadosAbs = filteredData.map(d => Math.abs(d.solucionados));
  const maxSolucionados = solucionadosAbs.length ? Math.max(...solucionadosAbs) : 0;
  const minSolucionados = solucionadosAbs.length ? Math.min(...solucionadosAbs) : 0;

  const maxBacklog = filteredData.length ? Math.max(...filteredData.map(d => d.backlog)) : 0;
  const minBacklog = filteredData.length ? Math.min(...filteredData.map(d => d.backlog)) : 0;

  // index of selected month for reference line within the filtered data
  const selectedIndex = selectedMonth ? filteredData.findIndex(d => d.mes === selectedMonth) : -1;

  // helper to toggle series
  const toggle = (key: keyof typeof visible) => setVisible(v => ({ ...v, [key]: !v[key] }));

  // custom tooltip to show absolute values and order backlog first
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const byKey: Record<string, any> = {};
    payload.forEach((p: any) => { byKey[p.dataKey] = p });
    const order = ['backlog', 'abertos', 'solucionados'];
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-md">
        <div className="font-medium">{label}</div>
        <div className="mt-1 grid gap-1">
          {order.map(k => {
            const item = byKey[k];
            if (!item) return null;
            const val = Math.abs(item.value ?? 0);
            const color = chartConfig[k as keyof typeof chartConfig]?.color || item.color;
            const label = chartConfig[k as keyof typeof chartConfig]?.label || item.name;
            return (
              <div key={k} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div style={{ width: 10, height: 10, backgroundColor: color }} className="rounded-sm" />
                  <span className="text-muted-foreground">{label}</span>
                </div>
                <div className="font-mono font-medium">{val.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Incidentes e Backlog</CardTitle>
        <CardDescription>Entrada (Abertos) vs. Saída (Solucionados) e a linha de tendência do backlog.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Abertos</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-sm font-mono">{minAbertos.toLocaleString()} — {maxAbertos.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Solucionados</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-sm font-mono">{minSolucionados.toLocaleString()} — {maxSolucionados.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Backlog</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-sm font-mono">{minBacklog.toLocaleString()} — {maxBacklog.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v)}>
              <SelectTrigger className="w-[96px] h-8">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todos</SelectItem>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(['abertos','solucionados','backlog'] as const).map(k => (
              <button key={k} onClick={() => toggle(k)} className="flex items-center gap-2 rounded px-2 py-1 text-sm" aria-pressed={!visible[k]}>
                <div style={{ width: 12, height: 12, backgroundColor: chartConfig[k].color }} className={visible[k] ? 'rounded' : 'rounded opacity-30'} />
                <span className={visible[k] ? 'text-foreground' : 'text-muted-foreground'}>{chartConfig[k].label}</span>
              </button>
            ))}
          </div>
        </div>

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart 
              data={filteredData} 
                margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
                stackOffset="sign"
            >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => Math.abs(value).toString()}
                />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<CustomTooltip />} />
                {selectedIndex >= 0 && filteredData[selectedIndex] && (
                  <>
                    <ReferenceLine x={filteredData[selectedIndex].name} stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: 'Selecionado', position: 'top' }} />
                    <ReferenceDot x={filteredData[selectedIndex].name} y={filteredData[selectedIndex].backlog} r={4} fill={chartConfig.backlog.color} stroke="#fff" />
                  </>
                )}
                <Legend />
                <defs>
                  <linearGradient id="grad-abertos" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-abertos)" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="var(--color-abertos)" stopOpacity="0.04" />
                  </linearGradient>
                  <linearGradient id="grad-solucionados" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-solucionados)" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="var(--color-solucionados)" stopOpacity="0.04" />
                  </linearGradient>
                </defs>

                {visible.abertos && (
                  <Area
                    type="monotone"
                    dataKey="abertos"
                    name="Abertos"
                    stackId="a"
                    stroke={chartConfig.abertos.color}
                    strokeWidth={2}
                    fill="url(#grad-abertos)"
                    activeDot={{ r: 4 }}
                  />
                )}

                {visible.solucionados && (
                  <Area
                    type="monotone"
                    dataKey="solucionados"
                    name="Solucionados"
                    stackId="a"
                    stroke={chartConfig.solucionados.color}
                    strokeWidth={2}
                    fill="url(#grad-solucionados)"
                    activeDot={{ r: 4 }}
                  />
                )}

                {visible.backlog && (
                  <Line
                    type="monotone"
                    dataKey="backlog"
                    stroke={chartConfig.backlog.color}
                    strokeWidth={3}
                    dot={false}
                    name="Backlog"
                  />
                )}
            </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
