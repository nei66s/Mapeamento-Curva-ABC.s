
"use client";

import { Line, LineChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, LabelList, ReferenceLine } from "recharts";
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

export function SlaChart({ data }: SlaChartProps) {

  const chartData = data.map(item => ({
    name: new Date(`${item.mes}-02`).toLocaleString("default", { month: "short" }),
    sla: item.sla_mensal,
    meta: item.meta_sla,
  }));

  const maxSla = Math.max(...chartData.map(d => d.sla));
  const minSla = Math.min(...chartData.map(d => d.sla));
  const avgMeta = chartData.length ? chartData.reduce((s, d) => s + (d.meta || 0), 0) / chartData.length : 0;
  const lastIndex = Math.max(0, chartData.length - 1);

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
                <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={
                        <ChartTooltipContent 
                             formatter={(value, name, item) => {
                                const key = name as keyof typeof chartConfig;
                                const config = chartConfig[key];
                                if (!config) return null;
                                const otherKey = key === 'sla' ? 'meta' : 'sla';
                                const otherValue = item && item.payload ? item.payload[otherKey] : undefined;
                                const diff = otherValue !== undefined ? Number(value) - Number(otherValue) : undefined;
                                return (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{config.label}:</span>
                                      <span>{Number(value).toFixed(2)}%</span>
                                    </div>
                                    {diff !== undefined && (
                                      <div className="text-sm text-muted-foreground">Diferença: <span className={diff >= 0 ? 'text-accent font-medium' : 'text-destructive font-medium'}>{diff.toFixed(2)}%</span></div>
                                    )}
                                  </div>
                                )
                            }}
                        />
                    }
                />
                <Legend verticalAlign="top" />
                <Area
                  type="monotone"
                  dataKey="sla"
                  stroke={chartConfig.sla.color}
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
                    strokeWidth={2}
                    dot={(props) => {
                      const { key, ...rest } = props as any;
                      return <CustomDot key={key} {...rest} lastIndex={lastIndex} />;
                    }}
                    activeDot={{ r: 6 }}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                    name="SLA Mensal"
                >
                    <LabelList dataKey="sla" content={(props) => <CustomLabel {...props} maxSla={maxSla} minSla={minSla} />} />
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
                {avgMeta > 0 && (
                  <ReferenceLine y={Number(avgMeta.toFixed(2))} stroke="var(--color-meta)" strokeDasharray="4 4" label={{ value: `Meta média ${avgMeta.toFixed(1)}%`, position: 'right', fill: 'var(--color-meta)' }} />
                )}
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
