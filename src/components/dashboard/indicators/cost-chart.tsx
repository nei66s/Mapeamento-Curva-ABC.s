
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { MaintenanceIndicator } from "@/lib/types";

interface CostChartProps {
    data: MaintenanceIndicator[];
}

const chartConfig = {
  realizado: {
    label: "Custo Realizado",
    color: "hsl(var(--chart-1))",
  },
  orcado: {
    label: "Custo Orçado",
    color: "hsl(var(--chart-2))",
  },
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};


export function CostChart({ data }: CostChartProps) {
  
  const chartData = data.map(item => ({
      name: new Date(`${item.mes}-02`).toLocaleString('default', { month: 'short' }),
      realizado: item.valor_mensal,
      orcado: item.valor_orcado,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custo Realizado vs. Orçado</CardTitle>
        <CardDescription>Acompanhamento dos custos mensais de manutenção em relação ao orçamento.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <AreaChart
                accessibilityLayer
                data={chartData} 
                margin={{ top: 20, right: 10, left: -10, bottom: 0 }}
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
                    tickFormatter={(value) => formatCurrency(Number(value) / 1000) + 'k'}
                />
                <Tooltip 
                    cursor={false}
                    content={
                        <ChartTooltipContent 
                             formatter={(value) => formatCurrency(Number(value))}
                        />
                    }
                />
                <Legend />
                 <Area
                    dataKey="orcado"
                    type="natural"
                    fill={chartConfig.orcado.color}
                    fillOpacity={0.4}
                    stroke={chartConfig.orcado.color}
                    stackId="a"
                    />
                <Area
                    dataKey="realizado"
                    type="natural"
                    fill={chartConfig.realizado.color}
                    fillOpacity={0.4}
                    stroke={chartConfig.realizado.color}
                    stackId="a"
                 />
            </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
