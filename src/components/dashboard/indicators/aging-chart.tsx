
"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ReferenceArea } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { MaintenanceIndicator } from "@/lib/types";

interface AgingChartProps {
    data: MaintenanceIndicator['aging'];
}

const chartConfig = {
  baixa: { label: "Baixa", color: "hsl(var(--chart-1))" },
  media: { label: "Média", color: "hsl(var(--chart-2))" },
  alta: { label: "Alta", color: "hsl(var(--chart-3))" },
  muitoAlta: { label: "Muito Alta", color: "hsl(var(--chart-4))" },
    proporcao: { label: "Proporção % por Aging", color: "hsl(var(--foreground))" },
};

export function AgingChart({ data }: AgingChartProps) {
    const [visible, setVisible] = React.useState({ baixa: true, media: true, alta: true, muitoAlta: true });

    const toggle = (k: keyof typeof visible) => setVisible(v => ({ ...v, [k]: !v[k] }));
    
    const agingRanges = [
        { key: 'inferior_30', label: 'Inferior a 30 dias' },
        { key: 'entre_30_60', label: '30 a 60 dias' },
        { key: 'entre_60_90', label: '60 a 90 dias' },
        { key: 'superior_90', label: 'Acima de 90 dias' },
    ];

    const totalChamados = agingRanges.reduce((acc, range) => {
        const rangeData = data[range.key as keyof typeof data];
        return acc + rangeData.baixa + rangeData.media + rangeData.alta + rangeData.muito_alta;
    }, 0);

    const chartData = agingRanges.map(range => {
        const rangeData = data[range.key as keyof typeof data];
        const totalInRange = (rangeData && (rangeData.baixa + rangeData.media + rangeData.alta + rangeData.muito_alta)) || 0;
        return {
            key: range.key,
            name: `${range.label}`,
            baixa: rangeData?.baixa || 0,
            media: rangeData?.media || 0,
            alta: rangeData?.alta || 0,
            muitoAlta: rangeData?.muito_alta || 0,
            proporcao: totalChamados > 0 ? (totalInRange / totalChamados) * 100 : 0,
        };
    });

        // Custom label renderer to show a small adaptive background and slightly larger, bolder numbers
        const ProporcaoLabel = (props: any) => {
            const { x, y, value } = props;
            if (value === undefined || value === null) return null;
            const text = `${Number(value).toFixed(2)}%`;
            const fontSize = 11;
            const paddingX = 8;
            const paddingY = 4;
            const estWidth = Math.max(36, text.length * (fontSize * 0.6));
            const rectX = (x ?? 0) + 8;
            const rectY = (y ?? 0) - fontSize - paddingY - 2;

            return (
                <g>
                    <rect x={rectX} y={rectY} width={estWidth + paddingX} height={fontSize + paddingY * 2} fill="var(--surface-background)" stroke="var(--surface-border)" rx={6} />
                    <text x={rectX + paddingX / 2} y={(rectY + fontSize + paddingY)} fontSize={fontSize} fontWeight={500} fill="var(--color-foreground)">{text}</text>
                </g>
            );
        }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Criticidade (Aging)</CardTitle>
        <CardDescription>Análise do backlog de chamados por faixa de tempo e criticidade.</CardDescription>
      </CardHeader>
      <CardContent>
                <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                                <div className="text-sm text-muted-foreground">Faixas</div>
                                {(['baixa','media','alta','muitoAlta'] as const).map(k => (
                                        <button key={k} onClick={() => toggle(k)} className="flex items-center gap-2 rounded px-2 py-1 text-sm" aria-pressed={!visible[k]}>
                                                <div style={{ width: 12, height: 12, backgroundColor: chartConfig[k].color }} className={visible[k] ? 'rounded' : 'rounded opacity-30'} />
                                                <span className={visible[k] ? 'text-foreground' : 'text-muted-foreground'}>{chartConfig[k].label}</span>
                                        </button>
                                ))}
                        </div>
                        <div className="text-xs text-muted-foreground">Total: {totalChamados}</div>
                </div>

                <ChartContainer config={chartConfig} className="h-[400px] w-full">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }} barCategoryGap={18} barGap={6}>
                                <defs>
                                    <linearGradient id="grad-baixa" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-baixa)" stopOpacity="0.32" />
                                        <stop offset="100%" stopColor="var(--color-baixa)" stopOpacity="0.12" />
                                    </linearGradient>
                                    <linearGradient id="grad-media" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-media)" stopOpacity="0.32" />
                                        <stop offset="100%" stopColor="var(--color-media)" stopOpacity="0.12" />
                                    </linearGradient>
                                    <linearGradient id="grad-alta" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-alta)" stopOpacity="0.32" />
                                        <stop offset="100%" stopColor="var(--color-alta)" stopOpacity="0.12" />
                                    </linearGradient>
                                    <linearGradient id="grad-muitoAlta" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="var(--color-muitoAlta)" stopOpacity="0.32" />
                                        <stop offset="100%" stopColor="var(--color-muitoAlta)" stopOpacity="0.12" />
                                    </linearGradient>
                                </defs>
                                {/* subtle grid and spacing */}
                                <ReferenceArea strokeOpacity={0} />
                {/* Highlight the first two ranges (inferior_30 and entre_30_60) */}
                {chartData[0] && (
                    <ReferenceArea x1={chartData[0].name} x2={chartData[0].name} strokeOpacity={0} fill="rgba(59,130,246,0.06)" />
                )}
                {chartData[1] && (
                    <ReferenceArea x1={chartData[1].name} x2={chartData[1].name} strokeOpacity={0} fill="rgba(234,88,12,0.06)" />
                )}
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis 
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    className="text-xs"
                />
                <YAxis 
                    yAxisId="left"
                    orientation="left"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent formatter={(value, name) => {
                    const key = name as keyof typeof chartConfig;
                    const config = chartConfig[key];
                    if (!config) return null;
                    const displayValue = key === 'proporcao' ? `${Number(value).toFixed(2)}%` : value;
                    return (
                      <div className="flex items-center gap-2">
                        <div style={{ width: 10, height: 10, backgroundColor: config.color }} className="rounded-sm" />
                        <span>{config.label}: {displayValue}</span>
                      </div>
                    )
                }} />} />
                <Legend />
                                {visible.baixa && (
                                    <Bar yAxisId="left" dataKey="baixa" fill="url(#grad-baixa)" name="Baixa" radius={[6, 6, 0, 0]} animationDuration={600}>
                                            <LabelList dataKey="baixa" position="top" className="fill-foreground font-mono font-medium text-xs" fontSize={12} />
                                    </Bar>
                                )}
                                {visible.media && (
                                    <Bar yAxisId="left" dataKey="media" fill="url(#grad-media)" name="Média" radius={[6, 6, 0, 0]} animationDuration={600}>
                                            <LabelList dataKey="media" position="top" className="fill-foreground font-mono font-medium text-xs" fontSize={12} />
                                    </Bar>
                                )}
                                {visible.alta && (
                                    <Bar yAxisId="left" dataKey="alta" fill="url(#grad-alta)" name="Alta" radius={[6, 6, 0, 0]} animationDuration={600}>
                                            <LabelList dataKey="alta" position="top" className="fill-foreground font-mono font-medium text-xs" fontSize={12} />
                                    </Bar>
                                )}
                                {visible.muitoAlta && (
                                    <Bar yAxisId="left" dataKey="muitoAlta" fill="url(#grad-muitoAlta)" name="Muito Alta" radius={[6, 6, 0, 0]} animationDuration={600}>
                                            <LabelList dataKey="muitoAlta" position="top" className="fill-foreground font-mono font-medium text-xs" fontSize={12} />
                                    </Bar>
                                )}
                <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="proporcao"
                    stroke={chartConfig.proporcao.color}
                    strokeWidth={2}
                    dot={{ r: 5, stroke: chartConfig.proporcao.color, strokeWidth: 1, fill: chartConfig.proporcao.color }}
                    name="Proporção %"
                >
                    <LabelList 
                        dataKey="proporcao" 
                        content={ProporcaoLabel}
                    />
                </Line>
            </ComposedChart>
        </ChartContainer>
                {/* debug removed */}
      </CardContent>
    </Card>
  );
}
