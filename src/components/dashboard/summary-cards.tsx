
"use client";

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity, AlertTriangle, Archive } from "lucide-react";
import type { Item } from "@/lib/types";

export function SummaryCards() {
  const [totalItems, setTotalItems] = useState(0);
  const [criticalItems, setCriticalItems] = useState(0);
  const [openIncidents, setOpenIncidents] = useState(0); // TODO: replace with DB once incidents are migrated
  const [loadError, setLoadError] = useState<string | null>(null);

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
          // stringify body safely for console and UI
          let bodyStr: string;
          try {
            bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
          } catch (e) {
            bodyStr = String(body);
          }
          console.error(`Failed to load items: status=${res.status} body=${bodyStr}`);
          setLoadError(`Failed to load items (status ${res.status})`);
          return;
        }
        const items: Item[] = await res.json();
        setTotalItems(items.length);
        setCriticalItems(items.filter(i => i.classification === 'A').length);
      } catch (e) {
        console.error('Error loading items', e);
        setLoadError(String(e ?? 'unknown error'));
      }
    };
    load();
  }, []);

  const summaryData = [
    {
      title: "Itens Totais",
      value: totalItems,
      icon: Archive,
      color: "text-primary",
    },
    {
      title: "Itens Curva A",
      value: criticalItems,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Incidentes Abertos",
      value: openIncidents,
      icon: Activity,
      color: "text-accent",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {summaryData.map((item, index) => (
        <Card key={index} className="shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-5 w-5 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
