"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { Item } from "@/lib/types";

const chartConfig = {
  items: {
    label: "Itens",
  },
  A: {
    label: "Curva A",
    color: "hsl(var(--destructive))",
  },
  B: {
    label: "Curva B",
    color: "hsl(var(--accent))",
  },
  C: {
    label: "Curva C",
    color: "hsl(var(--chart-2))",
  },
} as const;

export function ItemsByCurveChart() {
  const [data, setData] = useState([
    { curve: "A", items: 0, fill: chartConfig.A.color },
    { curve: "B", items: 0, fill: chartConfig.B.color },
    { curve: "C", items: 0, fill: chartConfig.C.color },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/items');
        if (!res.ok) {
          // Try to read any error body for better debugging
          let body: unknown = null;
          try {
            body = await res.json();
          } catch (err) {
            try {
              body = await res.text();
            } catch (e) {
              body = null;
            }
          }
          // stringify body safely for console
          let bodyStr: string;
          try {
            bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
          } catch (e) {
            bodyStr = String(body);
          }
          console.error(`Failed to load items: status=${res.status} body=${bodyStr}`);
          return;
        }
        const items: Item[] = await res.json();
        const counts = {
          A: items.filter(i => i.classification === 'A').length,
          B: items.filter(i => i.classification === 'B').length,
          C: items.filter(i => i.classification === 'C').length,
        } as const;
        setData([
          { curve: 'A', items: counts.A, fill: chartConfig.A.color },
          { curve: 'B', items: counts.B, fill: chartConfig.B.color },
          { curve: 'C', items: counts.C, fill: chartConfig.C.color },
        ]);
      } catch (e) {
        console.error('Error loading items', e);
      }
    };
    load();
  }, []);

  return (
    <Card className="shadow-lg h-full">
      <CardHeader>
        <CardTitle>Itens por Curva ABC</CardTitle>
        <CardDescription>Distribuição dos itens por classificação.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ChartContainer config={chartConfig}>
            <BarChart 
                data={data}
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="curve"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `Curva ${value}`}
                className="text-xs"
              />
              <YAxis 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted))" }}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar 
                dataKey="items" 
                radius={[4, 4, 0, 0]}
                label={{ position: "top", offset: 4, className: "fill-foreground font-medium text-sm" }}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
