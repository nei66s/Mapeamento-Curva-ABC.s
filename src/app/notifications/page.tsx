import React from 'react';
import PreferencesClient from './PreferencesClient';

export default async function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notificações</h1>
      <p className="mb-4">Veja suas notificações recentes e ajuste preferências.</p>
      <PreferencesClient />
    </div>
  );
}
