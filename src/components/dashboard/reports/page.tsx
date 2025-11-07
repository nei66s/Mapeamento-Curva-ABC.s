
'use client';

import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ReportForm } from '@/components/dashboard/reports/report-form';
import { mockTechnicalReports, mockIncidents } from '@/lib/mock-data';
import type { TechnicalReport } from '@/lib/types';
import { PlusCircle, Clock, Download, Workflow, User, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportPdfDocument } from '@/components/dashboard/reports/report-pdf-document';

export default function ReportsPage() {
  const [reports, setReports] = useState<TechnicalReport[]>(mockTechnicalReports);
  const [technicians, setTechnicians] = useState<Array<{id:string;name:string;role?:string}>>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<TechnicalReport | null>(null);
  const { toast } = useToast();
  const [reportToPrint, setReportToPrint] = useState<TechnicalReport | null>(null);

  const usersMap = useMemo(() => new Map(technicians.map(u => [u.id, u.name])), [technicians]);
  const incidentsMap = useMemo(() => new Map(mockIncidents.map(i => [i.id, i])), []);
  const techRoleMap = useMemo(() => new Map(technicians.map(t => [t.id, t.role])), [technicians]);

  // fetch technicians from API on mount
  useEffect(() => {
    let mounted = true;
    fetch('/api/technicians')
      .then(r => r.json())
      .then((data) => {
        if (!mounted) return;
        setTechnicians(Array.isArray(data) ? data : []);
      })
      .catch(() => setTechnicians([]));
    return () => { mounted = false; };
  }, []);

  const handleFormSubmit = (values: Omit<TechnicalReport, 'id' | 'createdAt' | 'status'>) => {
    if (selectedReport) {
      const updatedReport = { ...selectedReport, ...values };
      setReports(reports.map(rep => (rep.id === selectedReport.id ? updatedReport : rep)));
      toast({
        title: 'Laudo Atualizado!',
        description: `O laudo "${values.title}" foi atualizado com sucesso.`,
      });
    } else {
      const newReport: TechnicalReport = {
        ...values,
        id: `LTD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'Pendente',
      };
      setReports([newReport, ...reports]);
      toast({
        title: 'Laudo Técnico Criado!',
        description: `O laudo "${values.title}" foi registrado com sucesso.`,
      });
    }
    setIsFormOpen(false);
    setSelectedReport(null);
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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Laudos Técnicos"
        description="Centralize e gerencie os laudos técnicos gerados pela equipe."
      >
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => { setSelectedReport(null); setIsFormOpen(true); }} className="flex gap-2">
                <PlusCircle />
                Criar Laudo Técnico
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{selectedReport ? 'Editar Laudo Técnico' : 'Criar Novo Laudo Técnico'}</DialogTitle>
                </DialogHeader>
                <ReportForm
                    report={selectedReport}
                    incidents={mockIncidents}
          technicians={technicians}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormOpen(false)}
                />
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Nota explicativa sobre usos dos laudos */}
        <Card className="mb-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Nota: Os laudos técnicos podem ser gerados tanto para equipamentos inservíveis (por exemplo, para baixa/descarte) quanto para avaliar e laudar equipamentos em geral. Utilize o formulário para descrever o estado, as ações realizadas, recomendações e o destino sugerido do equipamento.
            </p>
          </CardContent>
        </Card>

        {/* Reports list */}
        <Card>
          <CardHeader>
          <CardTitle>Lista de Laudos</CardTitle>
          <CardDescription>{reports.length} laudos registrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reports.map(report => {
              const incident = report.incidentId ? incidentsMap.get(report.incidentId) : undefined;
              return (
                <Card key={report.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1">
                          <User className="h-4 w-4" /> 
                          {usersMap.get(report.technicianId) || 'Técnico desconhecido'}
                        </CardDescription>
                      </div>
            {/* status removed */}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      <strong>Problema Encontrado:</strong> {report.details.problemFound}
                    </p>
                    {incident && (
                      <Badge variant="secondary" className='gap-2'>
                          <Workflow className="h-4 w-4" />
                          Incidente: {incident.id} ({incident.itemName})
                      </Badge>
                    )}
                  </CardContent>
                  <CardFooter className='flex-wrap justify-between gap-y-2'>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>
                        {format(new Date(report.createdAt), 'dd/MM/yyyy')} ({formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: ptBR })})
                      </span>
                    </div>
                     <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(report)}><Edit /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(report)}><Download /></Button>
                     </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>
      
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
