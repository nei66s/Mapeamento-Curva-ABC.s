'use client';

import * as React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

const formUrl =
  'https://forms.office.com/Pages/ResponsePage.aspx?id=xGEbs6c1nkW4HYqRLHPI6y1alDpp2WpMkyBMjTVMFQ5UNVQyNFRJRTBYQVVDNE5aT1FQQlVMRkxUUyQlQCN0PWcu';

export default function TechnicalEvaluationPage() {
  const formRef = React.useRef<HTMLDivElement | null>(null);

  const handleDownloadPdf = async () => {
    try {
      const get = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? '';

      const payload = {
        'item-description': get('item-description'),
        'item-patrimony': get('item-patrimony'),
        'item-quantity': get('item-quantity'),
        'item-location': get('item-location'),
        'item-state': (document.querySelector('input[name="item-state"]:checked') as HTMLInputElement | null)?.value ?? '',
        'item-diagnosis': get('item-diagnosis'),
  'repair-viable': (document.querySelector('input[name="repair-viable"]:checked') as HTMLInputElement | null)?.value ?? '',
        'recommendations': (document.querySelector('input[name="rec-repair"]:checked') as HTMLInputElement | null)?.value ?? '',
        'tech-name': get('tech-name'),
        'tech-role': get('tech-role'),
      } as Record<string, any>;

      const res = await fetch('/api/laudos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao gerar PDF');
      const buf = await res.arrayBuffer();
      const blob = new Blob([buf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'laudo-tecnico.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Erro ao gerar PDF (server)', err);
      alert('Não foi possível gerar o PDF no servidor. Veja o console para mais detalhes.');
    }
  };
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        moduleKey="tools"
        title="Laudo de Avaliação Técnica"
        description="Preencha o laudo diretamente ou acesse a versão digital externa."
      >
        <Button onClick={handleDownloadPdf} className="flex gap-2">
          <Download />
          Baixar PDF
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2" ref={formRef}>
           <Card>
              <CardHeader>
                <CardTitle>Formulário de Avaliação</CardTitle>
                <CardDescription>Preencha os campos abaixo para gerar o laudo técnico.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Seção 1: Dados do Item Avaliado */}
                <section className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">1. Dados do Item Avaliado</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="item-description">Descrição do item</Label>
                      <Input id="item-description" placeholder="Ex: Ar Condicionado Split 12.000 BTUs" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-patrimony">Número de patrimônio (se houver)</Label>
                      <Input id="item-patrimony" placeholder="Ex: PM-123456" />
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="item-quantity">Quantidade</Label>
                      <Input id="item-quantity" type="number" defaultValue={1} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-location">Localização</Label>
                      <Input id="item-location" placeholder="Ex: Loja 10 - Campinas" />
                    </div>
                  </div>
                </section>

                {/* Seção 2: Avaliação Técnica */}
                <section className="space-y-6">
                  <h3 className="font-semibold text-lg border-b pb-2">2. Avaliação Técnica</h3>
                  <div className="space-y-2">
                    <Label>Estado do item</Label>
                    <RadioGroup className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="damaged" id="damaged" />
                        <Label htmlFor="damaged">Totalmente danificado</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="partial" id="partial" />
                        <Label htmlFor="partial">Parcialmente funcional</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="obsolete" id="obsolete" />
                        <Label htmlFor="obsolete">Obsoleto</Label>
                      </div>
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unused" id="unused" />
                        <Label htmlFor="unused">Fora de uso prolongado</Label>
                      </div>
                    </RadioGroup>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="item-diagnosis">Diagnóstico técnico detalhado</Label>
                      <Textarea id="item-diagnosis" placeholder="Descreva os problemas encontrados, testes realizados e a causa provável da falha." rows={4} />
                    </div>
                    
                     <div className="space-y-2">
                        <Label>Reparo viável?</Label>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                           <RadioGroup className="flex items-center gap-x-6">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="repair-yes" />
                                <Label htmlFor="repair-yes">Sim</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="repair-no" />
                                <Label htmlFor="repair-no">Não</Label>
                              </div>
                            </RadioGroup>
              {/* repair cost removed per request */}
                        </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Recomendações</Label>
                       <RadioGroup className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="repair" id="rec-repair" />
                          <Label htmlFor="rec-repair">Reparo / Reutilização</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="discard" id="rec-discard" />
                          <Label htmlFor="rec-discard">Descarte como sucata</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="evaluate" id="rec-evaluate" />
                          <Label htmlFor="rec-evaluate">Encaminhar para patrimônio</Label>
                        </div>
                      </RadioGroup>
                    </div>
                </section>
                
                 {/* Seção 3: Responsável */}
                <section className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">3. Responsável pela Avaliação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="tech-name">Nome completo do técnico</Label>
                      <Input id="tech-name" placeholder="Nome do avaliador" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tech-role">Cargo/Função</Label>
                      <Input id="tech-role" placeholder="Ex: Técnico de Refrigeração Sênior" />
                    </div>
                  </div>
                </section>
              </CardContent>
              <CardFooter>
                 <Button onClick={() => console.info('Enviar Laudo: atualmente sem integração - botão placeholder')}>Enviar Laudo</Button>
              </CardFooter>
            </Card>
        </div>

        {/* quick access card removed per request */}
      </div>
    </div>
  );
}
