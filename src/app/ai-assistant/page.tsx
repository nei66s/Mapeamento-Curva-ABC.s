import React from 'react';
import AIChatClient from './AIChatClient';

export default function AIAssistantPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Assistente AI</h1>
      <p className="mb-4">Converse com o assistente para obter insights sobre indicadores e ações sugeridas.</p>
      <AIChatClient />
    </div>
  );
}
