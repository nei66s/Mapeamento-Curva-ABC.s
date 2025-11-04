
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  description: string;
  icon: React.ElementType;
  iconColor?: string;
  formatAsCurrency?: boolean;
}

export function KpiCard({ title, value, change, changeType, description, icon: Icon, iconColor, formatAsCurrency = false }: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState<string | null>(null);

  useEffect(() => {
    let formattedValue: string;
    if (typeof value === 'number') {
      if (formatAsCurrency) {
        formattedValue = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      } else {
        formattedValue = value.toLocaleString('pt-BR');
      }
    } else {
        formattedValue = value;
    }
    setDisplayValue(formattedValue);
  }, [value, formatAsCurrency]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue ?? (typeof value === 'number' ? 'Calculando...' : value)}</div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change !== undefined && changeType && (
            <div className={cn("flex items-center", changeType === 'increase' ? 'text-green-600' : 'text-red-600')}>
              {changeType === 'increase' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {change.toFixed(2)}%
              <span className="ml-1 text-muted-foreground">vs mês anterior</span>
            </div>
          )}
           {description && !change && (
             <p className="text-xs text-muted-foreground">{description}</p>
           )}
        </div>
         {description && change && (
             <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
