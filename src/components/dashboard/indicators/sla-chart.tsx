
"use client";

import React from 'react';
import { Line, LineChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList, ReferenceLine } from "recharts";
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

interface SlaChartProps {
  data: MaintenanceIndicator[];
  selectedMonth?: string;
}

const chartConfig = {
  sla: {
    label: "SLA Mensal",
    color: "hsl(var(--chart-1))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--chart-2))",
  },
};

const labelBoxWidth = (text: string) => Math.max(28, String(text).length * 8 + 8);

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  value?: number | string;
  maxSla: number;
  minSla: number;
}

const CustomLabel = ({ x, y, value, maxSla, minSla }: CustomLabelProps) => {
  if (value !== maxSla && value !== minSla) return null;
  if (x == null || y == null) return null;
  const nx = Number(x);
  const ny = Number(y);
  if (Number.isNaN(nx) || Number.isNaN(ny)) return null;
  const text = `${value}%`;
  const w = labelBoxWidth(text);
  const h = 18;
  return (
    <g>
      <rect x={nx - w / 2} y={ny - 28} width={w} height={h} rx={4} fill="#fff" stroke="var(--border)" />
      <text x={nx} y={ny - 16} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11} fontWeight={600}>
        {text}
      </text>
    </g>
  );
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: {
    sla?: number;
    meta?: number;
  };
  index?: number;
  lastIndex: number;
}

const CustomDot = ({ cx, cy, payload, index, lastIndex }: CustomDotProps) => {

  if (cx == null || cy == null) return <g />;
  const sla = Number(payload?.sla ?? 0);
  const meta = payload?.meta;
  const isAlert = typeof meta === "number" && sla < meta;
  const isLast = index === lastIndex;
  const r = isAlert ? 6 : isLast ? 5 : 3;
  const fill = isAlert ? "var(--color-destructive,#ef4444)" : "#ffffff";
  const stroke = isAlert ? "var(--color-destructive,#ef4444)" : "var(--color-sla)";
  const labelText = `${sla.toFixed(0)}%`;
  const w = labelBoxWidth(labelText);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={isAlert ? 2 : 1} />
      {/* subtle halo */}
      <circle cx={cx} cy={cy} r={r + 4} fill={isAlert ? 'rgba(239,68,68,0.06)' : 'rgba(37,99,235,0.06)'} />
      {isLast && (
        <g>
          <rect x={cx - w / 2} y={cy - 28} width={w} height={18} rx={4} fill="#fff" stroke="var(--border)" />
          <text x={cx} y={cy - 16} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11} fontWeight={600}>
            {labelText}
          </text>
        </g>
      )}
    </g>
  );
};

export function SlaChart({ data, selectedMonth }: SlaChartProps) {

  const chartData = data.map(item => ({
    mes: item.mes,
    name: new Date(`${item.mes}-02`).toLocaleString("default", { month: "short" }),
    sla: item.sla_mensal,
    meta: item.meta_sla,
  }));

  const years = Array.from(new Set(chartData.map(d => d.mes.split('-')[0]))).sort((a,b) => Number(b) - Number(a));
  const currentYear = String(new Date().getFullYear());
  const initialYear = years.includes(currentYear) ? currentYear : (years[0] || 'all');
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear);

  const filteredData = selectedYear === 'all' ? chartData : chartData.filter(d => d.mes.startsWith(selectedYear));

  const maxSla = filteredData.length ? Math.max(...filteredData.map(d => d.sla)) : 0;
  const minSla = filteredData.length ? Math.min(...filteredData.map(d => d.sla)) : 0;
  const avgSla = filteredData.length ? filteredData.reduce((s, d) => s + (d.sla || 0), 0) / filteredData.length : 0;
  const lastIndex = Math.max(0, filteredData.length - 1);
  const lastMeta = filteredData.length ? Number(filteredData[lastIndex].meta || 0) : 0;
  const selectedMeta = selectedMonth
    ? Number(chartData.find(d => d.mes === selectedMonth)?.meta ?? lastMeta)
    : lastMeta;

  // no trend series — only average line is shown

  // Custom tooltip for SLA chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const slaItem = payload.find((p: any) => p.dataKey === 'sla');
    const metaItem = payload.find((p: any) => p.dataKey === 'meta');
    const slaVal = slaItem ? Number(slaItem.value) : undefined;
    const metaVal = metaItem ? Number(metaItem.value) : undefined;
    const diff = slaVal !== undefined && metaVal !== undefined ? slaVal - metaVal : undefined;
    const itemMes = slaItem?.payload?.mes ?? metaItem?.payload?.mes;
    let headerLabel = label;
    if (itemMes) {
      const d = new Date(`${itemMes}-02`);
      headerLabel = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear();
    }

    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-sm shadow-md">
        <div className="font-medium mb-1">{headerLabel}</div>
        <div className="grid gap-1">
          {slaVal !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, backgroundColor: chartConfig.sla.color }} className="rounded-sm" />
                <span className="text-muted-foreground">SLA</span>
              </div>
              <div className="font-mono font-medium">{slaVal.toFixed(1)}%</div>
            </div>
          )}
          {metaVal !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div style={{ width: 10, height: 10, backgroundColor: chartConfig.meta.color }} className="rounded-sm" />
                <span className="text-muted-foreground">Meta</span>
              </div>
              <div className="font-mono font-medium">{metaVal.toFixed(1)}%</div>
            </div>
          )}
          {diff !== undefined && (
            <div className="text-sm text-muted-foreground">Diferença: <span className={diff >= 0 ? 'text-accent font-medium' : 'text-destructive font-medium'}>{diff.toFixed(1)}%</span></div>
          )}
        </div>
      </div>
    )
  }

  // compute Y axis domain: if min is high, start the axis a bit below it (but not below 70)
  let yMin = Math.floor(minSla) - 5;
  if (minSla >= 70 && yMin < 70) yMin = 70;
  if (yMin < 0) yMin = 0;
  let yMax = Math.ceil(maxSla) + 3;
  if (yMax > 100) yMax = 100;
  if (yMax <= yMin) yMax = Math.min(100, yMin + 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{`SLA Mensal vs. Meta${selectedYear !== 'all' ? ` — ${selectedYear}` : ''}`}</CardTitle>
        <CardDescription>Acompanhamento do SLA alcançado em relação à meta estabelecida.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">SLA</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-sm font-mono">{minSla.toFixed(0)}% — {maxSla.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Média</span>
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-sm font-mono">{filteredData.length ? avgSla.toFixed(1) + '%' : '-'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={(v) => setSelectedYear(v)}>
              <SelectTrigger className="w-[96px] h-8">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {years.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart
              data={filteredData} 
              margin={{ top: 20, right: 10, left: -20, bottom: 40 }}
            >
                <defs>
                  <linearGradient id="slaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-sla)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="var(--color-sla)" stopOpacity="0.03" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ angle: -20, textAnchor: 'end', dy: 12 } as any}
                  interval={0}
                />
        <YAxis 
          tickLine={false}
          axisLine={false}
          domain={[yMin, yMax]}
          tickFormatter={(value) => `${value}%`}
        />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                <Legend verticalAlign="top" />
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12"/>
                  </filter>
                </defs>

                <Area
                  type="monotone"
                  dataKey="sla"
                  stroke={chartConfig.sla.color}
                  strokeWidth={3}
                  filter="url(#shadow)"
                  fill="url(#slaGradient)"
                  fillOpacity={1}
                  name="SLA Mensal"
                  animationDuration={800}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="sla"
                  stroke={chartConfig.sla.color}
                  strokeWidth={3}
                  dot={(props) => {
                    const { key, ...rest } = props as any;
                    return <CustomDot key={key} {...rest} lastIndex={lastIndex} />;
                  }}
                  activeDot={{ r: 7 }}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  name="SLA Mensal"
                  filter="url(#shadow)"
                >
                  <LabelList dataKey="sla" content={(props) => <CustomLabel {...props} maxSla={maxSla} minSla={minSla} />} />
                </Line>
                {/* trend removed; average line only */}
                <Line 
                    type="monotone"
                    dataKey="meta"
                    stroke={chartConfig.meta.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Meta"
                />
                {avgSla > 0 && (
                  <ReferenceLine
                    y={Number(avgSla.toFixed(2))}
                    stroke={chartConfig.sla.color}
                    strokeDasharray="4 4"
                  />
                )}
                {selectedMeta > 0 && (
                  <ReferenceLine y={Number(selectedMeta.toFixed(2))} stroke={chartConfig.meta.color} strokeDasharray="4 4" />
                )}
            </LineChart>
          </ChartContainer>
          {/* Overlay labels for meta and avg positioned relative to chart Y domain */}
          <div className="absolute inset-0 pointer-events-none">
            {(() => {
            const range = (yMax - yMin) || 1;
            const metaPct = 1 - (selectedMeta - yMin) / range;
            const avgPct = 1 - (avgSla - yMin) / range;
            const clamp = (v: number) => Math.max(0, Math.min(1, v));
            // if labels are vertically too close, position them laterally to avoid overlap
            const verticalGap = Math.abs(metaPct - avgPct);
            const labelsOverlap = verticalGap < 0.06;
            const avgLeft = '50%';
            const avgTransform = 'translate(-50%, -110%)';
            const metaLeft = '50%';
            const metaTransform = 'translate(-50%, -50%)';
            const metaTop = clamp(metaPct);
            // If overlap, render labels laterally (meta left, média right) with small vertical offsets
            if (labelsOverlap && selectedMeta > 0 && avgSla > 0) {
              const leftPct = 20; // percent from left for Média (moved left)
              const rightPct = 80; // percent from left for Meta
              const avgYOffset = -6; // px (lift média a bit)
              const metaYOffset = 6; // px
              return (
                <>
                  <div style={{ position: 'absolute', left: `${leftPct}%`, transform: `translate(-50%, ${avgYOffset}px)`, top: `${clamp(avgPct) * 100}%`, whiteSpace: 'nowrap' }}>
                    <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ color: chartConfig.sla.color, fontWeight: 600 }}>Média {avgSla.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div style={{ position: 'absolute', left: `${rightPct}%`, transform: `translate(-50%, ${metaYOffset}px)`, top: `${clamp(metaPct) * 100}%`, whiteSpace: 'nowrap' }}>
                    <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ color: chartConfig.meta.color, fontWeight: 600 }}>Meta {selectedMeta.toFixed(1)}%</span>
                    </div>
                  </div>
                </>
              )
            }
              return (
                <>
                  {selectedMeta > 0 && (
                  <div style={{ position: 'absolute', left: metaLeft, transform: metaTransform, top: `${metaTop * 100}%`, whiteSpace: 'nowrap' }}>
                    <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ color: chartConfig.meta.color, fontWeight: 600 }}>Meta {selectedMeta.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
                {avgSla > 0 && (
                  <div style={{ position: 'absolute', left: avgLeft, transform: avgTransform, top: `${clamp(avgPct) * 100}%`, whiteSpace: 'nowrap' }}>
                    <div style={{ background: '#fff', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <span style={{ color: chartConfig.sla.color, fontWeight: 600 }}>Média {avgSla.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </>
            )
          })()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
