
"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ComposedChart, Line, LabelList } from "recharts";
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
}

const chartConfig = {
  abertos: {
    label: "Abertos",
    color: "hsl(var(--accent))",
  },
  solucionados: {
    label: "Solucionados",
    color: "hsl(var(--chart-2))",
  },
  backlog: {
    label: "Backlog",
    color: "hsl(var(--destructive))",
  },
};

export function CallsChart({ data }: CallsChartProps) {
  
  const chartData = data.map(item => ({
      name: new Date(`${item.mes}-02`).toLocaleString('default', { month: 'short' }),
      abertos: item.chamados_abertos,
      solucionados: -item.chamados_solucionados,
      backlog: item.backlog,
  }));

  const maxAbertos = Math.max(...chartData.map(d => d.abertos));
  const minSolucionados = Math.min(...chartData.map(d => d.solucionados));
  const maxBacklog = Math.max(...chartData.map(d => d.backlog));
  const minBacklog = Math.min(...chartData.map(d => d.backlog));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Incidentes e Backlog</CardTitle>
        <CardDescription>Entrada (Abertos) vs. Saída (Solucionados) e a linha de tendência do backlog.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart 
                data={chartData} 
                margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
                stackOffset="sign"
            >
                <CartesianGrid vertical={false} />
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
                <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={
                        <ChartTooltipContent 
                             formatter={(value, name) => {
                                const key = name as keyof typeof chartConfig;
                                const config = chartConfig[key];
                                if (!config) return null;
                                
                                const absValue = Math.abs(Number(value));
                                return (
                                   <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full`} style={{backgroundColor: config.color}}></div>
                                        <span>{config.label}: {absValue.toLocaleString()}</span>
                                   </div>
                                )
                            }}
                        />
                    }
                />
                <Legend />
                <Bar dataKey="abertos" fill={chartConfig.abertos.color} radius={[4, 4, 0, 0]} name="Abertos" stackId="a">
                    <LabelList 
                        dataKey="abertos" 
                        position="top"
                        offset={8}
                        formatter={(value: number) => value === maxAbertos ? value.toLocaleString() : ''}
                        className="fill-foreground font-medium text-xs"
                    />
                </Bar>
                <Bar dataKey="solucionados" fill={chartConfig.solucionados.color} radius={[0, 0, 4, 4]} name="Solucionados" stackId="a">
                     <LabelList 
                        dataKey="solucionados" 
                        position="top"
                        formatter={(value: number) => value === minSolucionados ? Math.abs(value).toLocaleString() : ''}
                        className="fill-foreground font-medium text-xs"
                    />
                </Bar>
                <Line 
                    type="monotone"
                    dataKey="backlog"
                    stroke={chartConfig.backlog.color}
                    strokeWidth={2}
                    dot={false}
                    name="Backlog"
                >
                    <LabelList 
                        dataKey="backlog" 
                        position="top"
                        offset={8}
                        formatter={(value: number) => (value === maxBacklog || value === minBacklog) ? value.toLocaleString() : ''}
                        className="fill-destructive font-medium text-xs"
                    />
                </Line>
            </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
