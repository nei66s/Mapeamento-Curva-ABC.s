
'use client';

import { LogoImage } from '@/components/icons/logo-image';
import { UnsalvageableItem } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './unsalvageable-pdf-document.module.css';

interface UnsalvageablePdfDocumentProps {
  item: UnsalvageableItem;
  requesterName: string;
}

export function UnsalvageablePdfDocument({ item, requesterName }: UnsalvageablePdfDocumentProps) {
  const today = format(new Date(), "'Campinas,' dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div id={`pdf-content-${item.id}`} className={`${styles.page} bg-white text-black p-10 font-sans`}>
      <header className="flex items-center justify-between border-b-2 border-gray-800 pb-4">
        <div className="flex items-center gap-4">
          <LogoImage className="h-20 w-20" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manutenção Pague Menos</h1>
            <p className="text-gray-600">Termo de Autorização para Descarte de Ativo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">Protocolo Nº: <span className="font-normal">{item.id}</span></p>
          <p className="font-bold">Data da Solicitação: <span className="font-normal">{format(new Date(item.requestDate), 'dd/MM/yyyy', { locale: ptBR })}</span></p>
        </div>
      </header>

      <main className="mt-8">
        <h2 className="text-xl font-bold border-b border-gray-300 pb-2 mb-4 text-gray-700">Detalhes do Item para Descarte</h2>

        <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-sm mb-6">
          <div className="col-span-2">
            <p className="font-bold text-gray-600">Item:</p>
            <p className="p-2 bg-gray-50 rounded border border-gray-200">{item.itemName}</p>
          </div>
          <div>
            <p className="font-bold text-gray-600">Quantidade:</p>
            <p className="p-2 bg-gray-50 rounded border border-gray-200">{item.quantity}</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-bold text-gray-600 mb-1">Justificativa para o Descarte:</h3>
          <div className="p-3 bg-gray-50 rounded border border-gray-200 min-h-[100px] text-sm">
            <p>{item.reason}</p>
          </div>
        </div>

        <div className="mt-8 text-sm">
            <p>
                Pelo presente termo, eu, <span className="font-bold">{requesterName}</span>, solicitante desta baixa, declaro que o(s) item(ns) acima descrito(s) encontra(m)-se inservível(is) para o uso, não possuindo valor econômico ou funcional para a Empreendimentos Pague Menos S/A, devido ao motivo supracitado.
            </p>
            <p className="mt-4">
                Autorizo, portanto, que a equipe responsável proceda com o descarte ecologicamente correto do(s) referido(s) ativo(s), em conformidade com as normas ambientais e políticas internas da companhia.
            </p>
        </div>

        <p className="text-right my-12">{today}.</p>
      </main>

      <footer className="absolute bottom-10 left-10 right-10 text-center text-xs text-gray-400">
        <div className="flex justify-around items-center pt-8">
            <div className="w-1/3">
                <div className="border-t border-gray-400 w-full mx-auto"></div>
                <p className="mt-2">Solicitante: {requesterName}</p>
            </div>
            <div className="w-1/3">
                 <div className="border-t border-gray-400 w-full mx-auto"></div>
                <p className="mt-2">Gerente de Manutenção</p>
            </div>
        </div>
        <p className="mt-12">Este é um documento gerado automaticamente pela Plataforma de Manutenção Pague Menos.</p>
      </footer>
    </div>
  );
}
