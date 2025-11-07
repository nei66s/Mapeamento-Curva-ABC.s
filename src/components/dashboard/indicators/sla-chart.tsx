
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList } from "recharts";
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

export function SlaChart({ data }: SlaChartProps) {
  
  const chartData = data.map(item => ({
      name: new Date(`${item.mes}-02`).toLocaleString('default', { month: 'short' }),
      sla: item.sla_mensal,
      meta: item.meta_sla,
  }));

  const maxSla = Math.max(...chartData.map(d => d.sla));
  const minSla = Math.min(...chartData.map(d => d.sla));
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
        <CardTitle>SLA Mensal vs. Meta</CardTitle>
        <CardDescription>Acompanhamento do SLA alcançado em relação à meta estabelecida.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart
                data={chartData} 
                margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
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
          domain={[yMin, yMax]}
          tickFormatter={(value) => `${value}%`}
        />
                <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={
                        <ChartTooltipContent 
                             formatter={(value, name) => {
                                const key = name as keyof typeof chartConfig;
                                const config = chartConfig[key];
                                if (!config) return null;
                                
                      return (
                        <div className="flex items-center gap-2">
                           <span className="font-medium">{config.label}:</span>
                           <span>{Number(value).toFixed(2)}%</span>
                        </div>
                      )
                            }}
                        />
                    }
                />
                <Legend />
                <Line 
                    type="monotone"
                    dataKey="sla"
                    stroke={chartConfig.sla.color}
                    strokeWidth={2}
                    dot={true}
                    name="SLA Mensal"
                >
                    <LabelList
            dataKey="sla"
            position="top"
            offset={4}
            className="fill-foreground font-medium text-xs"
            formatter={(value: number, index: number) => {
              // show label only for max and min points to highlight peaks/valleys
              if (value === maxSla || value === minSla) {
                return `${value}%`;
              }
              return '';
            }}
                    />
                </Line>
                 <Line 
                    type="monotone"
                    dataKey="meta"
                    stroke={chartConfig.meta.color}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Meta"
                />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
