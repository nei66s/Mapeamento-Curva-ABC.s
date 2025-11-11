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

interface SummaryCardsProps {
  items?: Item[];
  /** When true, do not render the top-level summary cards (used when embedded in a HeroPanel) */
  hideOverallStats?: boolean;
}

export function SummaryCards({ items: propItems, hideOverallStats = false }: SummaryCardsProps = {}) {
  const [items, setItems] = useState<Item[]>(propItems ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (propItems) {
      setItems(propItems);
      setLoadError(null);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/items');
        if (!res.ok) {
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
          let bodyStr: string;
          try {
            bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
          } catch (e) {
            bodyStr = String(body);
          }
          console.error(`Failed to load items: status=${res.status} body=${bodyStr}`);
          if (mounted) setLoadError(`Failed to load items (status ${res.status})`);
          return;
        }
        const data: Item[] = await res.json();
        if (mounted) {
          setItems(data);
          setLoadError(null);
        }
      } catch (e) {
        console.error('Error loading items', e);
        if (mounted) setLoadError(String(e ?? 'unknown error'));
      }
    };
    load();
    return () => { mounted = false; };
  }, [propItems]);

  const totalItems = items.length;
  const criticalItems = items.filter(i => i.classification === 'A').length;
  const openIncidents = 0;
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

  if (hideOverallStats) {
    // When embedded in the HeroPanel we don't want the duplicate white summary cards.
    return null;
  }

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
