import React from 'react';
import type { TechnicalReport } from '@/lib/types';
// logo removed per UI request
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Props = {
  report: TechnicalReport;
  technicianName?: string;
  technicianRole?: string;
  incident?: any;
};

export function ReportPdfDocument({ report, technicianName, technicianRole, incident }: Props) {
  const createdAt = report.createdAt
    ? format(new Date(report.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : '';

  const stateLabel = {
    damaged: 'Totalmente danificado',
    partial: 'Parcialmente funcional',
    obsolete: 'Obsoleto',
    unused: 'Fora de uso',
  } as Record<string, string>;

  const recommendationLabel = {
    repair: 'Reparo / Reutilização',
    discard: 'Descarte como sucata',
    evaluate: 'Encaminhar para patrimônio',
  } as Record<string, string>;

  return (
    <div id={`pdf-content-${report.id}`} className="pdf-a4">
      {/* Page 1 */}
      <div className="pdf-page">
        <div className="pdf-header">
          <div className="flex items-center gap-4">
            <div>
              <h1>Fixly</h1>
              <div className="text-sm text-muted-foreground">Laudo Técnico</div>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="label">
              ID: <span className="value">{report.id}</span>
            </p>
            <p className="label">
              Data: <span className="value">{createdAt}</span>
            </p>
            <p className="label">
              Técnico: <span className="value">{technicianName || 'N/A'}</span>
            </p>
          </div>
        </div>

        <section className="mb-4">
          <h2>1. Informações do Item</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="label">Descrição</p>
              <p className="value">{report.details.itemDescription || '-'}</p>
            </div>
            <div>
              <p className="label">Patrimônio</p>
              <p className="value">{report.details.itemPatrimony || '-'}</p>
            </div>
            <div>
              <p className="label">Quantidade</p>
              <p className="value">{report.details.itemQuantity ?? '-'}</p>
            </div>
            <div>
              <p className="label">Localização</p>
              <p className="value">{report.details.itemLocation || '-'}</p>
            </div>
            <div>
              <p className="label">Estado</p>
              <p className="value">{report.details.itemState ? stateLabel[report.details.itemState] : '-'}</p>
            </div>
            <div>
              <p className="label">Incidente</p>
              <p className="value">{incident?.id ?? '-'}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Page 2 */}
      <div className="pdf-page">
        <section className="mb-4 text-sm">
          <h2>2. Diagnóstico</h2>
          <div>
            <p className="value">{report.details.itemDiagnosis || report.details.problemFound || '-'}</p>
          </div>
        </section>

        <section className="mb-4 text-sm">
          <h2>3. Ações Realizadas</h2>
          <p className="value">{report.details.actionsTaken || '-'}</p>
        </section>
      </div>

      {/* Page 3 */}
      <div className="pdf-page">
        <section className="mb-4 text-sm">
          <h2>4. Recomendações</h2>
          <p className="value">
            {report.details.recommendations
              ? (recommendationLabel[report.details.recommendations as string] ?? String(report.details.recommendations))
              : '-'}
          </p>

          {report.details.repairViable && (
            <p className="value mt-2">
              <strong>Reparo viável:</strong> {report.details.repairViable === 'yes' ? 'Sim' : 'Não'}
            </p>
          )}

          {/* repair cost removed per request */}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-8">
          <div>
            <p className="label">Responsável pela Avaliação</p>
            <div className="mt-8">
              <p className="font-bold value">{technicianName || ''}</p>
              <p className="value">{(typeof (technicianRole) !== 'undefined') ? technicianRole : ''}</p>
              <div className="mt-8 border-t pt-2">Assinatura</div>
            </div>
          </div>

          <div>
            <p className="label">Observações</p>
            <p className="value mt-4">
              {report.details.recommendations ? recommendationLabel[report.details.recommendations as string] : ''}
            </p>
          </div>
        </section>

  <div className="pdf-footer">Fixly — Laudo Técnico</div>
      </div>
    </div>
  );
}

