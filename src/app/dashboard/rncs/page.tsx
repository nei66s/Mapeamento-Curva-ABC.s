
'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
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
import { RncForm } from '@/components/dashboard/rncs/rnc-form';
import { RncBulkForm } from '@/components/dashboard/rncs/rnc-bulk-form';
import type { RNC, RncStatus, Incident, Supplier } from '@/lib/types';
import { PlusCircle, Clock, MoreVertical, Pencil, FileWarning, Users, AlertTriangle, Workflow, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RncPdfDocument } from '@/components/dashboard/rncs/rnc-pdf-document';

const statusVariantMap: Record<RncStatus, 'destructive' | 'accent' | 'success' | 'default'> = {
  Aberta: 'destructive',
  'Em Análise': 'accent',
  Concluída: 'success',
  Cancelada: 'default',
};

export default function RncPage() {
  const [rncs, setRncs] = useState<RNC[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);
  const [selectedRnc, setSelectedRnc] = useState<RNC | null>(null);
  const { toast } = useToast();
  const [rncToPrint, setRncToPrint] = useState<RNC | null>(null);

  const suppliersMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

  useEffect(() => {
    const load = async () => {
      try {
        const [rncsRes, suppliersRes, incidentsRes] = await Promise.all([
          fetch('/api/rncs'),
          fetch('/api/suppliers'),
          fetch('/api/incidents'),
        ]);
        if (!rncsRes.ok || !suppliersRes.ok || !incidentsRes.ok) throw new Error('Failed to load data');
        const [rncsJson, suppliersJson, incidentsJson] = await Promise.all([
          rncsRes.json(),
          suppliersRes.json(),
          incidentsRes.json(),
        ]);
        setRncs(rncsJson);
        setSuppliers(suppliersJson);
        setIncidents(incidentsJson);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleFormSubmit = (values: Omit<RNC, 'id' | 'createdAt' | 'status'>) => {
    (async () => {
      try {
        if (selectedRnc) {
          const res = await fetch('/api/rncs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedRnc.id, ...values }),
          });
          if (!res.ok) throw new Error('Failed to update RNC');
          const updated: RNC = await res.json();
          setRncs(rncs.map(rnc => (rnc.id === selectedRnc.id ? updated : rnc)));
          toast({ title: 'RNC Atualizada!', description: `O registro "${values.title}" foi atualizado.` });
        } else {
          const res = await fetch('/api/rncs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          });
          if (!res.ok) throw new Error('Failed to create RNC');
          const created: RNC = await res.json();
          setRncs(prev => [created, ...prev]);
          toast({ title: 'RNC Registrada!', description: `O registro "${values.title}" foi criado.` });
        }
      } catch (e) {
        console.error(e);
        toast({ title: 'Erro', description: 'Não foi possível salvar a RNC.' });
      } finally {
        setIsFormOpen(false);
        setSelectedRnc(null);
      }
    })();
  };
  
  const handleBulkSubmit = (newRncs: Omit<RNC, 'id' | 'createdAt' | 'status'>[]) => {
      (async () => {
        try {
          const res = await fetch('/api/rncs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRncs),
          });
          if (!res.ok) throw new Error('Failed to create RNCs');
          const created: RNC[] = await res.json();
          setRncs(prev => [...created, ...prev]);
          toast({ title: 'RNCs Registradas!', description: `${created.length} novos registros foram adicionados.` });
        } catch (e) {
          console.error(e);
          toast({ title: 'Erro', description: 'Não foi possível adicionar as RNCs.' });
        } finally {
          setIsBulkFormOpen(false);
        }
      })();
  };

  const openEditDialog = (rnc: RNC) => {
    setSelectedRnc(rnc);
    setIsFormOpen(true);
  };

  const handleDownloadPdf = async (rnc: RNC) => {
    setRncToPrint(rnc);

    // Allow time for the hidden component to render with the correct data
    setTimeout(async () => {
      const input = document.getElementById(`pdf-content-${rnc.id}`);
      if (input) {
        try {
          const canvas = await html2canvas(input, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`RNC-${rnc.id}.pdf`);
          toast({
            title: 'PDF Gerado!',
            description: `O download do RNC ${rnc.id} foi iniciado.`,
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
       setRncToPrint(null);
    }, 100);
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        moduleKey="rncs"
        title="Registros de Não Conformidade"
        description="Gerencie e acompanhe descumprimentos e problemas com fornecedores."
      >
        <Dialog open={isBulkFormOpen} onOpenChange={setIsBulkFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsBulkFormOpen(true)} className="flex gap-2">
              <PlusCircle />
              Gerar RNCs em Massa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Registrar Novas RNCs em Massa</DialogTitle>
            </DialogHeader>
            <RncBulkForm
              suppliers={suppliers}
              incidents={incidents}
              onSubmit={handleBulkSubmit}
              onCancel={() => setIsBulkFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Registros de Não Conformidade</CardTitle>
          <CardDescription>{rncs.length} registros encontrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rncs.map(rnc => (
              <Card key={rnc.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{rnc.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 pt-1">
                        <Users className="h-4 w-4" /> 
                        {suppliersMap.get(rnc.supplierId) || 'Fornecedor desconhecido'}
                      </CardDescription>
                    </div>
                     <div className="flex items-center -mt-2 -mr-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(rnc)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadPdf(rnc)}>
                            <Download className="h-4 w-4" />
                        </Button>
                     </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {rnc.description}
                  </p>
                  <div className='flex items-center justify-between'>
                    <Badge variant="outline" className='gap-2'>
                        <AlertTriangle className="h-4 w-4" />
                        {rnc.classification}
                    </Badge>
                     {rnc.incidentId && (
                        <Badge variant="secondary" className='gap-2'>
                            <Workflow className="h-4 w-4" />
                            {rnc.incidentId}
                        </Badge>
                     )}
                  </div>
                </CardContent>
                <CardFooter className='justify-between'>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(rnc.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                   <Badge variant={statusVariantMap[rnc.status]}>
                        {rnc.status}
                    </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar RNC</DialogTitle>
            </DialogHeader>
            <RncForm
              rnc={selectedRnc}
              suppliers={suppliers}
              incidents={incidents}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      
      {rncToPrint && (
        <div className="absolute -left-[9999px] -top-[9999px]">
          <RncPdfDocument 
            rnc={rncToPrint} 
            supplierName={suppliersMap.get(rncToPrint.supplierId) || 'N/A'}
          />
        </div>
      )}
    </div>
  );
}
