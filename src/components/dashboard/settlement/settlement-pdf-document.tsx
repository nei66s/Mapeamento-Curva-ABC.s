'use client';

import { LogoImage } from '@/components/icons/logo-image';
import { SettlementLetter, Supplier } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SettlementPdfDocumentProps {
  letter: SettlementLetter;
  supplier?: Supplier;
}

export function SettlementPdfDocument({ letter, supplier }: SettlementPdfDocumentProps) {
  const today = format(new Date(), "'Campinas,' dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  
  const period = letter.periodStartDate && letter.periodEndDate 
    ? `referente ao período de ${format(new Date(letter.periodStartDate), 'dd/MM/yyyy')} a ${format(new Date(letter.periodEndDate), 'dd/MM/yyyy')}`
    : '';

  return (
    <div id={`pdf-content-${letter.id}`} className="bg-white text-black p-12 font-serif text-justify" style={{ width: '210mm', minHeight: '297mm' }}>
      <header className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-10">
        <div className="flex items-center gap-4">
          <LogoImage className="h-16 w-16" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manutenção Pague Menos</h1>
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-bold">Contrato/OS: <span className="font-normal">{letter.contractId}</span></p>
          <p className="font-bold">Data da Solicitação: <span className="font-normal">{format(new Date(letter.requestDate), 'dd/MM/yyyy')}</span></p>
        </div>
      </header>

      <main className="mt-8">
        <h2 className="text-2xl font-bold text-center mb-10 uppercase">Carta de Quitação de Serviços</h2>

        <p className="mb-6 leading-relaxed">
            À <span className="font-bold">EMPREENDIMENTOS PAGUE MENOS S/A</span>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº 00.000.000/0000-00, com sede na cidade de Campinas/SP.
        </p>

        <p className="mb-6 leading-relaxed">
            Pela presente, nós, <span className="font-bold">{supplier?.name || '[NOME DO FORNECEDOR]'}</span>, pessoa jurídica de direito privado, inscrita no CNPJ/MF sob o nº <span className="font-bold">{supplier?.cnpj || '[CNPJ DO FORNECEDOR]'}</span>, com sede em <span className="font-bold">[Endereço do Fornecedor]</span>, declaramos, para todos os fins de direito, que recebemos da 
            <span className="font-bold">EMPREENDIMENTOS PAGUE MENOS S/A</span> o valor total referente à prestação de serviços/fornecimento de materiais, conforme Contrato/Ordem de Serviço nº 
            <span className="font-bold"> {letter.contractId}</span>, cujo objeto foi <span className="font-bold">"{letter.description}"</span>, {period}.
        </p>
        
        <p className="mb-6 leading-relaxed">
            Damos, portanto, plena, geral, rasa e irrevogável quitação dos valores pagos, para nada mais reclamar, seja a que título for, em relação ao referido contrato ou serviço, declarando-o integralmente cumprido e finalizado.
        </p>

        <p className="mb-12 leading-relaxed">
            Esta quitação abrange o principal, juros, multas, e quaisquer outras obrigações decorrentes do ajuste, servindo o presente como o mais forte e valioso recibo.
        </p>
        
        <p className="text-right mb-16">{today}.</p>
      </main>

      <footer className="absolute bottom-12 left-12 right-12 text-center text-sm text-gray-600">
        <div className="flex justify-center items-center">
            <div className="w-2/3">
                <div className="border-t border-gray-500 w-full mx-auto"></div>
                <p className="mt-2 font-bold">{supplier?.name || '[NOME DO FORNECEDOR]'}</p>
                <p>{supplier?.cnpj || '[CNPJ DO FORNECEDOR]'}</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
