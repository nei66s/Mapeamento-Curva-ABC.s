
"use client";

import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
  proporcao: { label: "Proporção % por Aging", color: "hsl(var(--chart-5))" },
};

export function AgingChart({ data }: AgingChartProps) {
    const agingRanges = [
        { key: 'inferior_30', label: 'Inferior a 30 dias' },
        { key: 'entre_30_60', label: 'Entre 30 e 60 dias' },
        { key: 'entre_60_90', label: 'Entre 60 e 90 dias' },
        { key: 'superior_90', label: 'Superior a 90 dias' },
    ];

    const totalChamados = agingRanges.reduce((acc, range) => {
        const rangeData = data[range.key as keyof typeof data];
        return acc + rangeData.baixa + rangeData.media + rangeData.alta + rangeData.muito_alta;
    }, 0);

    const chartData = agingRanges.map(range => {
        const rangeData = data[range.key as keyof typeof data];
        const totalInRange = rangeData.baixa + rangeData.media + rangeData.alta + rangeData.muito_alta;
        return {
            name: `${range.label} == ${totalInRange}`,
            baixa: rangeData.baixa,
            media: rangeData.media,
            alta: rangeData.alta,
            muitoAlta: rangeData.muito_alta,
            proporcao: totalChamados > 0 ? (totalInRange / totalChamados) * 100 : 0,
        };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Criticidade (Aging)</CardTitle>
        <CardDescription>Análise do backlog de chamados por faixa de tempo e criticidade.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                <CartesianGrid vertical={false} />
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
                <Tooltip
                    content={<ChartTooltipContent 
                        formatter={(value, name) => {
                            const key = name as keyof typeof chartConfig;
                            const config = chartConfig[key];
                            if (!config) return null;
                            
                            const displayValue = key === 'proporcao' ? `${Number(value).toFixed(2)}%` : value;

                            return (
                               <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full`} style={{backgroundColor: config.color}}></div>
                                    <span>{config.label}: {displayValue}</span>
                               </div>
                            )
                        }}
                    />}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="baixa" fill={chartConfig.baixa.color} name="Baixa" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="baixa" position="top" className="fill-foreground" fontSize={11} />
                </Bar>
                <Bar yAxisId="left" dataKey="media" fill={chartConfig.media.color} name="Média" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="media" position="top" className="fill-foreground" fontSize={11} />
                </Bar>
                <Bar yAxisId="left" dataKey="alta" fill={chartConfig.alta.color} name="Alta" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="alta" position="top" className="fill-foreground" fontSize={11} />
                </Bar>
                <Bar yAxisId="left" dataKey="muitoAlta" fill={chartConfig.muitoAlta.color} name="Muito Alta" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="muitoAlta" position="top" className="fill-foreground" fontSize={11} />
                </Bar>
                <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="proporcao"
                    stroke={chartConfig.proporcao.color}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    name="Proporção %"
                >
                    <LabelList 
                        dataKey="proporcao" 
                        position="top" 
                        offset={8} 
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        className="fill-foreground font-medium"
                        fontSize={12}
                    />
                </Line>
            </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
