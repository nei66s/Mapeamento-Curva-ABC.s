"use client";
import React, { useState } from 'react';

type Message = { id: number; from: 'user' | 'assistant'; text: string };

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), from: 'user', text: input };
    setMessages((s) => [...s, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.text }),
      });
      const json = await res.json();
      const reply: Message = { id: Date.now() + 1, from: 'assistant', text: json?.answer ?? 'Desculpe, sem resposta.' };
      setMessages((s) => [...s, reply]);
    } catch (err) {
      const errMsg: Message = { id: Date.now() + 2, from: 'assistant', text: 'Erro ao contatar o assistente.' };
      setMessages((s) => [...s, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded p-4">
      <div className="h-64 overflow-auto mb-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={m.from === 'user' ? 'text-right' : 'text-left'}>
            <div className={m.from === 'user' ? 'inline-block bg-blue-100 p-2 rounded' : 'inline-block bg-gray-100 p-2 rounded'}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Pergunte sobre indicadores, p.ex. 'Como melhorar A items?'"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={send} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}
