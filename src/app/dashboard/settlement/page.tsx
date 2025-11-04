'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { SettlementForm } from '@/components/dashboard/settlement/settlement-form';
import type { SettlementLetter, SettlementStatus, User, Supplier } from '@/lib/types';
import { mockUsers } from '@/lib/users';
import { PlusCircle, Clock, Check, Download, Handshake, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SettlementPdfDocument } from '@/components/dashboard/settlement/settlement-pdf-document';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusVariantMap: Record<SettlementStatus, 'success' | 'accent'> = {
  Recebida: 'success',
  Pendente: 'accent',
};

// Mock a logged-in user. In a real app, this would come from an auth context.
const getCurrentUser = (): User | undefined => {
    // To test the supplier view, change this to 'user-006'
    return mockUsers.find(u => u.id === 'user-001'); 
};


export default function SettlementPage() {
  const [letters, setLetters] = useState<SettlementLetter[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [letterToPrint, setLetterToPrint] = useState<SettlementLetter | null>(null);
  const { toast } = useToast();
  
  const currentUser = getCurrentUser();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [lRes, sRes] = await Promise.all([
          fetch('/api/settlements'),
          fetch('/api/suppliers'),
        ]);
        const [l, s] = await Promise.all([lRes.json(), sRes.json()]);
        setLetters(Array.isArray(l) ? l : []);
        setSuppliers(Array.isArray(s) ? s : []);
      } catch (e) {
        console.error('Failed to load settlements', e);
      }
    };
    loadAll();
  }, []);

  const suppliersMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

  const visibleLetters = useMemo(() => {
    if (currentUser?.role === 'fornecedor') {
      return letters.filter(l => l.supplierId === currentUser.supplierId);
    }
    return letters;
  }, [letters, currentUser]);
  
  const pendingLetters = useMemo(() => visibleLetters.filter(l => l.status === 'Pendente').sort((a,b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()), [visibleLetters]);
  const receivedLetters = useMemo(() => visibleLetters.filter(l => l.status === 'Recebida').sort((a,b) => new Date(b.receivedDate!).getTime() - new Date(a.receivedDate!).getTime()), [visibleLetters]);

  const handleFormSubmit = (values: Omit<SettlementLetter, 'id' | 'requestDate' | 'status'>) => {
    const newLetter: SettlementLetter = {
      ...values,
      id: `SET-${Date.now()}`,
      requestDate: new Date().toISOString(),
      status: 'Pendente',
    };
    setLetters([newLetter, ...letters]);
    toast({
      title: 'Solicitação Registrada!',
      description: `A solicitação de quitação para o contrato "${values.contractId}" foi criada.`,
    });
    setIsFormOpen(false);
  };
  
  const handleMarkAsReceived = (letterId: string) => {
      setLetters(prev => prev.map(l => l.id === letterId ? { ...l, status: 'Recebida', receivedDate: new Date().toISOString() } : l));
  };
  
  const handleFileUploadSimulation = (letterId: string) => {
      // In a real application, this would open a file dialog and upload the file
      // to a server or a cloud storage service like Firebase Storage.
      // Here, we just simulate the successful action.
      handleMarkAsReceived(letterId);
       toast({
          title: 'Arquivo "Enviado"!',
          description: 'O documento foi marcado como recebido. Em uma aplicação real, o upload seria feito aqui.',
      });
  }

  const handleDownloadPdf = async (letter: SettlementLetter) => {
    setLetterToPrint(letter);

    setTimeout(async () => {
      const input = document.getElementById(`pdf-content-${letter.id}`);
      if (input) {
        try {
          const canvas = await html2canvas(input, { scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`CartaQuitacao-${letter.contractId}.pdf`);
          toast({
            title: 'PDF Gerado!',
            description: `O download do modelo de quitação para ${letter.contractId} foi iniciado.`,
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
       setLetterToPrint(null);
    }, 100);
  };

  const renderLetterCard = (letter: SettlementLetter) => (
     <Card key={letter.id} className="flex flex-col">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <CardTitle className="text-lg">{letter.contractId}</CardTitle>
                    <CardDescription className="flex items-center gap-2 pt-1">
                        <Handshake className="h-4 w-4" /> 
                        {suppliersMap.get(letter.supplierId) || 'Fornecedor desconhecido'}
                    </CardDescription>
                </div>
                <Badge variant={statusVariantMap[letter.status]}>
                    {letter.status}
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
                {letter.description}
            </p>
             <div className='flex flex-wrap items-center justify-between gap-2'>
                <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(letter)}>
                    <Download className="mr-2 h-4 w-4" />
                    Imprimir Modelo
                </Button>
                {letter.status === 'Pendente' && (currentUser?.role === 'admin' || currentUser?.role === 'fornecedor') && (
                     <Button size="sm" onClick={() => handleFileUploadSimulation(letter.id)}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Anexar Quitação Assinada
                    </Button>
                )}
            </div>
        </CardContent>
        <CardFooter className='flex-wrap justify-between text-xs text-muted-foreground gap-y-2'>
            <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <span>Solicitada em: {format(new Date(letter.requestDate), 'dd/MM/yyyy')}</span>
            </div>
            {letter.receivedDate && (
                <div className="flex items-center">
                    <span>Recebida em: {format(new Date(letter.receivedDate), 'dd/MM/yyyy')}</span>
                </div>
            )}
        </CardFooter>
    </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cartas de Quitação"
        description="Gerencie e controle o recebimento de cartas de quitação de fornecedores."
      >
        {currentUser?.role !== 'fornecedor' && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => setIsFormOpen(true)} className="flex gap-2">
                    <PlusCircle />
                    Registrar Solicitação
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                    <DialogTitle>Registrar Nova Solicitação de Quitação</DialogTitle>
                    </DialogHeader>
                    <SettlementForm
                    suppliers={suppliers}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setIsFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        )}
      </PageHeader>

        <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="received">Recebidas</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                    {pendingLetters.length > 0 ? pendingLetters.map(renderLetterCard) : <p className="text-muted-foreground col-span-3 text-center py-10">Nenhuma carta de quitação pendente.</p>}
                </div>
            </TabsContent>
            <TabsContent value="received">
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
                     {receivedLetters.length > 0 ? receivedLetters.map(renderLetterCard) : <p className="text-muted-foreground col-span-3 text-center py-10">Nenhuma carta de quitação recebida ainda.</p>}
                </div>
            </TabsContent>
        </Tabs>
      
      {letterToPrint && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <SettlementPdfDocument 
            letter={letterToPrint} 
            supplier={suppliers.find((s: Supplier) => s.id === letterToPrint.supplierId)}
          />
        </div>
      )}
    </div>
  );
}
