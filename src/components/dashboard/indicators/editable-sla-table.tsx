
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
import { Label } from '@/components/ui/label';

interface EditableSlaTableProps {
  data: MaintenanceIndicator[];
  setData: React.Dispatch<React.SetStateAction<MaintenanceIndicator[]>>;
  annualSlaGoal: number;
  setAnnualSlaGoal: (value: number) => void;
}

export function EditableSlaTable({ data, setData, annualSlaGoal, setAnnualSlaGoal }: EditableSlaTableProps) {
  const handleSlaChange = (
    id: string,
    value: string
  ) => {
    const newValue = parseFloat(value) || 0;
    setData(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, sla_mensal: newValue } : item
      )
    );
  };
  
  const handleGoalChange = (value: string) => {
    setAnnualSlaGoal(parseInt(value, 10) || 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução SLA vs. Meta</CardTitle>
        <CardDescription>
          Preencha os valores de SLA alcançado para cada mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
            <Label htmlFor="annual-goal">Meta Anual de SLA (%)</Label>
            <Input
                id="annual-goal"
                type="number"
                value={annualSlaGoal}
                onChange={e => handleGoalChange(e.target.value)}
                className="h-8 w-32"
            />
        </div>
        <ScrollArea className="h-60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">SLA Alcançado (%)</TableHead>
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
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      value={item.sla_mensal}
                      onChange={e => handleSlaChange(item.id, e.target.value)}
                      className="h-8 w-32 ml-auto"
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
