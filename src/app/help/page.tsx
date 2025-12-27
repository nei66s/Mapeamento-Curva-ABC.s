import Link from 'next/link';
import React from 'react';

export default function HelpPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ajuda & Onboarding</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">Primeiros passos</h2>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Conectar a base de dados (ver `src/lib/db.ts`).</li>
          <li>Importar lojas/itens via o menu <Link href="/import">Importar/Exportar</Link>.</li>
          <li>Rodar o build de indicadores em <Link href="/indicators">Indicadores</Link>.</li>
          <li>Verificar qualidade dos dados em <Link href="/help#quality">Qualidade dos Dados</Link>.</li>
        </ol>
      </section>

      <section id="quality" className="mb-6">
        <h2 className="text-lg font-semibold">Qualidade dos Dados</h2>
        <p className="mt-2">Nesta página você encontra regras comuns e como corrigi-las em lote.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold">FAQ</h2>
        <ul className="mt-2 list-disc list-inside space-y-1">
          <li>Como atualizar a Curva ABC? — Use o botão de rebuild em `Indicadores`.</li>
          <li>Como corrigir lat/lng de lojas? — Use `Importar/Exportar` com o CSV de lojas.</li>
          <li>Precisa de ajuda automática? — Tente o <Link href="/ai-assistant">Assistente AI</Link>.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Recursos</h2>
        <ul className="mt-2 list-disc list-inside">
          <li>
            Página de <Link href="/notifications">Notificações</Link> para ver alertas e preferências.
          </li>
          <li>
            Caso precise de suporte, abra um issue ou fale com a equipe responsável.
          </li>
        </ul>
      </section>
    </div>
  );
}
