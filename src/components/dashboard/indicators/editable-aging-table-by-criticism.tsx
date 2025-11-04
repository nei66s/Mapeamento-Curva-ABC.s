
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { MaintenanceIndicator, AgingCriticidade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EditableAgingTableProps {
    indicator: MaintenanceIndicator;
    onUpdate: (data: MaintenanceIndicator['aging']) => void;
}

type AgingRange = keyof MaintenanceIndicator['aging'];
type CriticidadeKey = keyof AgingCriticidade;

export function EditableAgingTableByCriticism({ indicator, onUpdate }: EditableAgingTableProps) {
  const [agingData, setAgingData] = useState(indicator.aging);
  const { toast } = useToast();

  useEffect(() => {
    setAgingData(indicator.aging);
  }, [indicator]);

  const handleChange = (
    range: AgingRange,
    criticidade: CriticidadeKey,
    value: string
  ) => {
    const newValue = parseInt(value, 10) || 0;
    const newData = {
        ...agingData,
        [range]: {
            ...agingData[range],
            [criticidade]: newValue
        }
    };
    setAgingData(newData);
  };

  const handleSaveChanges = () => {
    onUpdate(agingData);
    toast({
        title: 'Dados de Aging Salvos!',
        description: 'A distribuição de criticidade por aging foi atualizada.',
    })
  };

  const agingRanges: { key: AgingRange, label: string }[] = [
    { key: 'inferior_30', label: 'Até 30 dias' },
    { key: 'entre_30_60', label: '30-60 dias' },
    { key: 'entre_60_90', label: '60-90 dias' },
    { key: 'superior_90', label: 'Acima de 90 dias' },
  ];

  const criticidadeKeys: { key: CriticidadeKey, label: string }[] = [
      { key: 'baixa', label: 'Baixa' },
      { key: 'media', label: 'Média' },
      { key: 'alta', label: 'Alta' },
      { key: 'muito_alta', label: 'Muito Alta' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Aging do Backlog por Criticidade</CardTitle>
                <CardDescription>
                Preencha a distribuição dos chamados por tempo e criticidade para o mês selecionado.
                </CardDescription>
            </div>
            <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Faixa de Tempo</TableHead>
              {criticidadeKeys.map(c => <TableHead key={c.key} className="text-center">{c.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {agingRanges.map(range => (
              <TableRow key={range.key}>
                <TableCell className="font-medium">{range.label}</TableCell>
                {criticidadeKeys.map(criticidade => (
                    <TableCell key={criticidade.key} className="text-center">
                        <Input
                            type="number"
                            value={agingData[range.key][criticidade.key]}
                            onChange={e => handleChange(range.key, criticidade.key, e.target.value)}
                            className="h-8 w-24 mx-auto"
                        />
                    </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
