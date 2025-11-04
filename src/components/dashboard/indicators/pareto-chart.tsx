'use client';

import { Bar, BarChart, CartesianGrid, ComposedChart, LabelList, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface ParetoChartProps {
  data: {
    category: string;
    count: number;
  }[];
}

const chartConfig = {
  count: {
    label: 'Qtd. Incidentes',
    color: 'hsl(var(--chart-1))',
  },
  cumulative: {
    label: '% Acumulada',
    color: 'hsl(var(--chart-2))',
  },
};

export function ParetoChart({ data }: ParetoChartProps) {
  const totalCount = data.reduce((acc, item) => acc + item.count, 0);
  
  let cumulativeCount = 0;
  const chartData = data.map(item => {
    cumulativeCount += item.count;
    return {
      category: item.category,
      count: item.count,
      cumulative: totalCount > 0 ? (cumulativeCount / totalCount) * 100 : 0,
    };
  });

  return (
    <div className="h-[400px] w-full">
      <ChartContainer config={chartConfig}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 20,
            bottom: 40,
            left: -10,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            className="text-xs"
          />
          <YAxis
            yAxisId="left"
            stroke="hsl(var(--muted-foreground))"
            tickLine={false}
            axisLine={false}
            label={{ value: "Qtd. Incidentes", angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="hsl(var(--muted-foreground))"
            tickFormatter={(value) => `${value.toFixed(0)}%`}
            tickLine={false}
            axisLine={false}
            label={{ value: "% Acumulada", angle: 90, position: 'insideRight', offset: 10, style: { textAnchor: 'middle' } }}
          />
          <Tooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === 'cumulative') {
                    return `${(value as number).toFixed(1)}%`;
                  }
                  return String(value);
                }}
              />
            }
          />
          <Legend />
          <Bar dataKey="count" yAxisId="left" fill="var(--color-count)" radius={[4, 4, 0, 0]}>
            <LabelList dataKey="count" position="top" className="fill-foreground" fontSize={12} />
          </Bar>
          <Line
            type="monotone"
            dataKey="cumulative"
            yAxisId="right"
            stroke="var(--color-cumulative)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
