
'use client';
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
import type { MaintenanceIndicator } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditableCostTableProps {
  data: MaintenanceIndicator[];
  setData: React.Dispatch<React.SetStateAction<MaintenanceIndicator[]>>;
}

export function EditableCostTable({ data, setData }: EditableCostTableProps) {
  const handleChange = (
    id: string,
    field: keyof Pick<MaintenanceIndicator, 'valor_mensal' | 'valor_orcado'>,
    value: string
  ) => {
    const newValue = parseFloat(value) || 0;
    setData(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, [field]: newValue } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custos (Real vs. Orçado)</CardTitle>
        <CardDescription>
          Preencha os valores de custo para cada mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Realizado</TableHead>
                <TableHead>Orçado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {new Date(`${item.mes}-02`).toLocaleString('default', {
                      month: 'short',
                      year: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.valor_mensal}
                      onChange={e => handleChange(item.id, 'valor_mensal', e.target.value)}
                      className="h-8"
                      step="0.01"
                    />
                  </TableCell>
                   <TableCell>
                    <Input
                      type="number"
                      value={item.valor_orcado}
                      onChange={e => handleChange(item.id, 'valor_orcado', e.target.value)}
                      className="h-8"
                       step="0.01"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
