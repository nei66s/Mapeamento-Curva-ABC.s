
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

interface EditableCallsTableProps {
  data: MaintenanceIndicator[];
  setData: React.Dispatch<React.SetStateAction<MaintenanceIndicator[]>>;
}

export function EditableCallsTable({ data, setData }: EditableCallsTableProps) {
  const handleChange = (
    id: string,
    field: keyof Pick<MaintenanceIndicator, 'chamados_abertos' | 'chamados_solucionados' | 'backlog'>,
    value: string
  ) => {
    const newValue = parseInt(value, 10) || 0;
    setData(prevData =>
      prevData.map(item =>
        item.id === id ? { ...item, [field]: newValue } : item
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo de Incidentes e Backlog</CardTitle>
        <CardDescription>
          Preencha os valores de incidentes abertos, solucionados e o backlog.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Abertos</TableHead>
                <TableHead>Solucionados</TableHead>
                <TableHead>Backlog</TableHead>
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
                      value={item.chamados_abertos}
                      onChange={e => handleChange(item.id, 'chamados_abertos', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                   <TableCell>
                    <Input
                      type="number"
                      value={item.chamados_solucionados}
                      onChange={e => handleChange(item.id, 'chamados_solucionados', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.backlog}
                      onChange={e => handleChange(item.id, 'backlog', e.target.value)}
                      className="h-8"
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
