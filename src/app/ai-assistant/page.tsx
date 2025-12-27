import React from 'react';
import dynamic from 'next/dynamic';

const AIChat = dynamic(() => import('./AIChat'), { ssr: false });

export default function AIAssistantPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Assistente AI</h1>
      <p className="mb-4">Converse com o assistente para obter insights sobre indicadores e ações sugeridas.</p>
      <AIChat />
    </div>
  );
}
