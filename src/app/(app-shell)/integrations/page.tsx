import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';

const uploads = [
  { title: 'Importação de lojas', status: 'Concluído', details: '3,8k registros processados • 15 pendências', when: 'Há 2h' },
  { title: 'Atualização de inventário', status: 'Concluído', details: '1,1k SKUs ajustados • 2 alertas', when: 'Há 1 dia' },
  { title: 'Validação de fornecedores', status: 'Pendência', details: '3 fornecedores aguardam confirmação', when: 'Há 3 dias' },
];

const connectors = [
  { name: 'API de manutenção', status: 'Ativa', note: 'Recebendo dados a cada 30 min' },
  { name: 'Pasta compartilhada (SFTP)', status: 'Monitoramento', note: 'Sem novos arquivos nas últimas 12h' },
];

const statusVariant = (status: string) => {
  if (status === 'Concluído' || status === 'Ativa') return 'outline';
  if (status === 'Pendência' || status === 'Monitoramento') return 'secondary';
  return 'destructive';
};

export const metadata = {
  title: 'Painel de Integrações e Uploads',
};

export default function IntegrationsPage() {
  return (
    <div className="page-stack">
      <PageHeader
        title="Painel de Integrações e Uploads"
        description="Central de jobs de importação, status de conectores e alertas de dados que alimentam o sistema."
      />

      <Card>
        <CardHeader>
          <CardTitle>Uploads recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploads.map(upload => (
              <div key={upload.title} className="surface-glass p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{upload.when}</span>
                  <Badge variant={statusVariant(upload.status)}>{upload.status}</Badge>
                </div>
                <p className="mt-1 text-lg font-semibold">{upload.title}</p>
                <p className="text-sm text-muted-foreground">{upload.details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conectores monitorados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {connectors.map(connector => (
              <div key={connector.name} className="surface-glass p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold leading-tight">{connector.name}</p>
                  <Badge variant={statusVariant(connector.status)}>{connector.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{connector.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
