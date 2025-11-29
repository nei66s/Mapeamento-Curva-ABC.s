'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuditLog } from '@/hooks/use-audit-logs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { dateLocale } from '@/lib/config';

function JsonBlock({ data, label }: { data?: Record<string, unknown> | null; label: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <pre className="whitespace-pre-wrap break-all text-xs bg-muted/40 rounded-md p-2">
        {data ? JSON.stringify(data, null, 2) : '—'}
      </pre>
    </div>
  );
}

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const log = useAuditLog(params.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Detalhe do log" description="Diff entre payloads antes e depois." />
      <Card>
        <CardHeader>
          <CardTitle>Ação {log.data?.action}</CardTitle>
          <CardDescription>
            {log.data?.userName || log.data?.userId} · {log.data ? new Date(log.data.timestamp).toLocaleString(dateLocale) : null}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Entidade: {log.data?.entity}</Badge>
            {log.data?.entityId && <Badge variant="outline">ID: {log.data?.entityId}</Badge>}
            {log.data?.ip && <Badge variant="outline">IP: {log.data.ip}</Badge>}
            {log.data?.location && <Badge variant="outline">Local: {log.data.location}</Badge>}
          </div>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            <JsonBlock data={log.data?.before} label="Antes" />
            <JsonBlock data={log.data?.after} label="Depois" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
