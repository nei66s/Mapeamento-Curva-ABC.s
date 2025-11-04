
'use client';

import { LogoImage } from '@/components/icons/logo-image';
import { RNC } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RncPdfDocumentProps {
  rnc: RNC;
  supplierName: string;
}

export function RncPdfDocument({ rnc, supplierName }: RncPdfDocumentProps) {
  return (
    <div id={`pdf-content-${rnc.id}`} className="bg-white text-black p-10 font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <LogoImage className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manutenção Pague Menos</h1>
            <p className="text-gray-600">Documento de Não Conformidade</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">RNC Nº: <span className="font-normal">{rnc.id}</span></p>
          <p className="font-bold">Data: <span className="font-normal">{format(new Date(rnc.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span></p>
        </div>
      </header>

      <main className="mt-8">
        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-gray-700">Detalhes do Registro</h2>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div className="col-span-2">
            <p className="font-bold text-gray-600">Título:</p>
            <p className="p-2 bg-gray-50 rounded border border-gray-200">{rnc.title}</p>
          </div>
          <div>
            <p className="font-bold text-gray-600">Fornecedor:</p>
            <p className="p-2 bg-gray-50 rounded border border-gray-200">{supplierName}</p>
          </div>
          <div>
            <p className="font-bold text-gray-600">Classificação:</p>
            <p className="p-2 bg-gray-50 rounded border border-gray-200">{rnc.classification}</p>
          </div>
          <div>
            <p className="font-bold text-gray-600">Status Atual:</p>
            <p className="p-2 bg-gray-50 rounded border border-gray-200">{rnc.status}</p>
          </div>
          {rnc.incidentId && (
            <div>
              <p className="font-bold text-gray-600">Incidente Associado:</p>
              <p className="p-2 bg-gray-50 rounded border border-gray-200">{rnc.incidentId}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-gray-600 mb-1">Descrição da Não Conformidade:</h3>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 min-h-[100px] text-sm">
            <p>{rnc.description}</p>
          </div>
        </div>

         <div className="mt-16 text-xs text-gray-500">
            <h3 className="font-bold text-base text-gray-700 mb-4 border-t pt-4">Plano de Ação Corretiva</h3>
             <div className="border-b h-12 mb-6"></div>
             <div className="border-b h-12 mb-6"></div>
             <div className="border-b h-12 mb-6"></div>
        </div>
      </main>

      <footer className="absolute bottom-10 left-10 right-10 text-center text-xs text-gray-400">
        <div className="flex justify-around items-center pt-8">
            <div className="w-1/3">
                <div className="border-t border-gray-400 w-full mx-auto"></div>
                <p className="mt-2">Assinatura do Responsável (Pague Menos)</p>
            </div>
            <div className="w-1/3">
                 <div className="border-t border-gray-400 w-full mx-auto"></div>
                <p className="mt-2">Assinatura do Fornecedor</p>
            </div>
        </div>
        <p className="mt-12">Este é um documento gerado automaticamente pela Plataforma de Manutenção Pague Menos.</p>
      </footer>
    </div>
  );
}
