
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ReportForm } from '@/components/dashboard/reports/report-form';
import type { TechnicalReport, Incident } from '@/lib/types';
import { PlusCircle, Clock, Download, Workflow, User, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportPdfDocument } from '@/components/dashboard/reports/report-pdf-document';
import { PagePanel } from '@/components/layout/page-panel';

export default function ReportsPage() {
  const [reports, setReports] = useState<TechnicalReport[]>([]);
  const [technicians, setTechnicians] = useState<Array<{id:string;name:string;role?:string}>>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const { toast } = useToast();
  const [reportToPrint, setReportToPrint] = useState<TechnicalReport | null>(null);

  const usersMap = useMemo(() => new Map(technicians.map(u => [u.id, u.name])), [technicians]);
  const incidentsMap = useMemo(() => new Map(incidents.map(i => [i.id, i])), [incidents]);
  const techRoleMap = useMemo(() => new Map(technicians.map(t => [t.id, t.role])), [technicians]);

  // fetch technicians, reports and incidents from API on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [techRes, repRes, incRes] = await Promise.all([
          fetch('/api/technicians'),
          fetch('/api/reports'),
          fetch('/api/incidents'),
        ]);
        if (!mounted) return;
        const [tech, rep, inc] = await Promise.all([
          techRes.json().catch(() => []),
          repRes.json().catch(() => []),
          incRes.json().catch(() => []),
        ]);
        setTechnicians(Array.isArray(tech) ? tech : []);
        setReports(Array.isArray(rep) ? rep : []);
        setIncidents(Array.isArray(inc) ? inc : []);
      } catch (err) {
        if (!mounted) return;
        setTechnicians([]);
        setReports([]);
        setIncidents([]);
        toast({ variant: 'destructive', title: 'Falha ao carregar laudos', description: 'Não foi possível carregar dados de laudos e técnicos.' });
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleFormSubmit = async (values: Omit<TechnicalReport, 'id' | 'createdAt' | 'status'>) => {
    try {
      if (selectedReport) {
        const res = await fetch('/api/reports', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: selectedReport.id, ...values }) });
        if (!res.ok) throw new Error('Failed to update report');
        const updated: TechnicalReport = await res.json();
        setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
        toast({ title: 'Laudo Atualizado!', description: `O laudo "${values.title}" foi atualizado com sucesso.` });
      } else {
        const res = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
        if (!res.ok) throw new Error('Failed to create report');
        const created: TechnicalReport = await res.json();
        setReports(prev => [created, ...prev]);
        toast({ title: 'Laudo Técnico Criado!', description: `O laudo "${values.title}" foi registrado com sucesso.` });
      }
    } catch (err) {
      console.error('report save error', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o laudo.' });
    } finally {
      setIsFormOpen(false);
      setSelectedReport(null);
    }
  };
  
  // status removed per request — no-op for completion

  const openEditDialog = (report: TechnicalReport) => {
    setSelectedReport(report);
    setIsFormOpen(true);
  };

  const handleDownloadPdf = async (report: TechnicalReport) => {
    setReportToPrint(report);

    setTimeout(async () => {
      const input = document.getElementById(`pdf-content-${report.id}`);
      if (input) {
        try {
          const canvas = await html2canvas(input, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');

          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();

          // Calculate image height in mm for full canvas
          const imgProps = { width: canvas.width, height: canvas.height };
          const imgHeightMm = (imgProps.height * pdfWidth) / imgProps.width;

          // Determine slice height in pixels that fits one PDF page
          const pxPerMm = imgProps.height / imgHeightMm; // pixels per mm
          const pageHeightPx = Math.floor(pdfHeight * pxPerMm);

          let remainingHeight = canvas.height;
          let offsetY = 0;
          const totalPages = Math.ceil(canvas.height / pageHeightPx);
          let pageIndex = 0;

          while (remainingHeight > 0) {
            // create a canvas for the current page slice
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(pageHeightPx, remainingHeight);
            const ctx = pageCanvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, offsetY, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);

            const pageImgData = pageCanvas.toDataURL('image/png');
            // add image to PDF scaled to page dimensions
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // add footer with page number
            pageIndex += 1;
            const footerText = `Página ${pageIndex} / ${totalPages}`;
            pdf.setFontSize(10);
            pdf.setTextColor(100);
            pdf.text(footerText, pdfWidth / 2, pdfHeight - 10, { align: 'center' });

            remainingHeight -= pageCanvas.height;
            offsetY += pageCanvas.height;
            if (remainingHeight > 0) pdf.addPage();
          }

          pdf.save(`Laudo-${report.id}.pdf`);
          toast({
            title: 'PDF Gerado!',
            description: `O download do laudo ${report.id} foi iniciado.`,
          });
        } catch (error) {
          console.error("Error generating PDF:", error);
          toast({
            variant: 'destructive',
            title: 'Erro ao Gerar PDF',
            description: 'Não foi possível gerar o arquivo PDF.',
          });
        }
      }
       setReportToPrint(null);
    }, 100);
  };

  return (
    <div className="flex flex-col gap-6">
      <PagePanel className="p-6 space-y-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                Laudos Técnicos
              </p>
              <p className="text-lg font-semibold text-foreground">
                Centralize e gerencie os laudos técnicos gerados pela equipe.
              </p>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                  onClick={() => { setSelectedReport(null); setIsFormOpen(true); }}
                >
                  <PlusCircle className="h-4 w-4" />
                  Criar Laudo Técnico
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{selectedReport ? 'Editar Laudo Técnico' : 'Criar Novo Laudo Técnico'}</DialogTitle>
                </DialogHeader>
                <ReportForm
                  report={selectedReport}
                  incidents={incidents}
                  technicians={technicians}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setIsFormOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
              <Workflow className="h-4 w-4 text-orange-500" />
              {reports.length} laudos registrados
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
              <User className="h-4 w-4 text-orange-500" />
              {technicians.length} técnicos conectados
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
              <Clock className="h-4 w-4 text-orange-500" />
              Última sincronização há {(reports[0]?.createdAt && formatDistanceToNow(new Date(reports[0].createdAt), { locale: ptBR })) || '—'}
            </div>
          </div>
        </div>
      </PagePanel>

      <PagePanel className="space-y-5 p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {reports.map(report => {
            const incident = report.incidentId ? incidentsMap.get(report.incidentId) : undefined;
            return (
              <div
                key={report.id}
                className="flex flex-col justify-between overflow-hidden rounded-3xl border border-border/40 bg-card/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_25px_45px_rgba(15,23,42,0.15)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Workflow className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-base font-semibold text-foreground">{report.title}</p>
                      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        {format(new Date(report.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[0.6rem] uppercase tracking-[0.25em]">
                    {report.status}
                  </Badge>
                </div>
                <p className="mt-4 text-sm text-muted-foreground min-h-[52px]">
                  <strong>Problema Encontrado:</strong> {report.details.problemFound}
                </p>
                {incident && (
                  <Badge variant="outline" className="mt-3 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em]">
                    <Workflow className="h-4 w-4" />
                    Incidente: {incident.id} ({incident.itemName})
                  </Badge>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                  <span>Técnico: {usersMap.get(report.technicianId) ?? '—'}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(report)}>
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(report)}>
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </PagePanel>

      {reportToPrint && (
        <div className="sr-only printable-offscreen">
          <ReportPdfDocument 
            report={reportToPrint} 
            technicianName={usersMap.get(reportToPrint.technicianId) || 'N/A'}
            technicianRole={techRoleMap.get(reportToPrint.technicianId) || ''}
            incident={reportToPrint.incidentId ? incidentsMap.get(reportToPrint.incidentId) : undefined}
          />
        </div>
      )}
    </div>
  );
}
