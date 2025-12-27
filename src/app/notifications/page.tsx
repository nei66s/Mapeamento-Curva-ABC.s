import React from 'react';
import dynamic from 'next/dynamic';

const Preferences = dynamic(() => import('./Preferences'), { ssr: false });

export default async function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notificações</h1>
      <p className="mb-4">Veja suas notificações recentes e ajuste preferências.</p>
      <Preferences />
    </div>
  );
}
