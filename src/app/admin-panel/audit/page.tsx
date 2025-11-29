'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { dateLocale } from '@/lib/config';
import { Eye } from 'lucide-react';

type AuditFilters = {
  userId?: string;
  entity?: string;
  action?: string;
  from?: string;
  to?: string;
};

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({});
  const logs = useAuditLogs(filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Auditoria"
        description="Tabela de logs com filtros avançados e trilha completa."
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Por usuário, entidade, ação e intervalo.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="User ID" className="w-32" onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value }))} />
            <Input placeholder="Entidade" className="w-28" onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))} />
            <Input placeholder="Ação" className="w-28" onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))} />
            <Input type="date" onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
            <Input type="date" onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
            <Button variant="outline" onClick={() => logs.refetch()}>Aplicar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs.data?.items || []).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.userName || log.userId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString(dateLocale)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.ip} · {log.userAgent}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin-panel/audit/${log.id}`}>
                          <Eye className="mr-1 h-4 w-4" /> Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
