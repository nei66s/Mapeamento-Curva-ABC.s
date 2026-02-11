"use client";

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
} from 'recharts';

type ComplianceItem = { itemId: string; status: string };
type StoreComplianceData = { storeId: string; storeName?: string; visitDate: string; items: ComplianceItem[] };

export function ComplianceChart({ storeData, displayDate, selectedDate }: {
  storeData: StoreComplianceData[];
  displayDate: Date;
  selectedDate?: Date | undefined;
}) {
  const data = useMemo(() => {
    const target = selectedDate || displayDate;
    const year = target.getFullYear();
    const month = target.getMonth();

    const buckets: Record<number, { day: string; visits: number; completed: number; total: number }> = {};

    // initialize all days of month to keep x axis stable
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      buckets[d] = { day: String(d).padStart(2, '0'), visits: 0, completed: 0, total: 0 };
    }

    storeData.forEach((s) => {
      const dt = new Date(s.visitDate);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        const day = dt.getDate();
        const bucket = buckets[day] || { day: String(day), visits: 0, completed: 0, total: 0 };
        bucket.visits += 1;
        s.items.forEach(it => {
          bucket.total += 1;
          if (String(it.status).toLowerCase().includes('completed') || String(it.status).toLowerCase() === 'concluido' || String(it.status).toLowerCase() === 'concluído') {
            bucket.completed += 1;
          }
        });
        buckets[day] = bucket;
      }
    });

    return Object.keys(buckets)
      .map(k => {
        const b = buckets[Number(k)];
        return {
          day: b.day,
          visits: b.visits,
          completionRate: b.total ? Math.round((b.completed / b.total) * 100) : 0,
        };
      })
      .sort((a, b) => Number(a.day) - Number(b.day));
  }, [storeData, displayDate, selectedDate]);

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" orientation="left" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
          <Tooltip formatter={(value: any, name: any) => (name === 'completionRate' ? `${value}%` : value)} />
          <Bar yAxisId="right" dataKey="visits" barSize={16} fill="rgba(59,130,246,0.85)" />
          <Line yAxisId="left" type="monotone" dataKey="completionRate" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default ComplianceChart;
