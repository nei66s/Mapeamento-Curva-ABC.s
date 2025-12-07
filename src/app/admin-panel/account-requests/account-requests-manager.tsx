'use client';

import { useMemo, useState } from 'react';
import { AccountRequest } from '@/lib/account-requests.server';

type Notification = {
  type: 'success' | 'error';
  message: string;
};

type Props = {
  initialRequests: AccountRequest[];
};

export default function AccountRequestsManager({ initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<Notification | null>(null);

  const hasRequests = requests.length > 0;

  const actionLabel = (action: 'approve' | 'reject', loading: boolean) => {
    if (!loading) return action === 'approve' ? 'Aprovar' : 'Rejeitar';
    return action === 'approve' ? 'Aprovando...' : 'Rejeitando...';
  };

  const notificationClass = useMemo(() => {
    if (!notification) return '';
    return notification.type === 'success'
      ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
      : 'bg-red-50 border border-red-100 text-red-700';
  }, [notification]);

  const handleAction = async (action: 'approve' | 'reject', id: string) => {
    setNotification(null);
    setLoadingIds((prev) => [...prev, id]);
    try {
      const response = await fetch('/api/admin-panel/account-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, id }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json?.error || 'Não foi possível concluir a ação.');
      }
      setRequests((prev) => prev.filter((item) => item.id !== id));
      setNotification({
        type: 'success',
        message: action === 'approve' ? 'Solicitação aprovada.' : 'Solicitação rejeitada.',
      });
    } catch (err: any) {
      console.error('account-requests action failed', err);
      setNotification({
        type: 'error',
        message: err?.message || 'Erro ao executar a ação. Tente novamente.',
      });
    } finally {
      setLoadingIds((prev) => prev.filter((item) => item !== id));
    }
  };

  return (
    <>
      <div aria-live="polite">
        {notification ? (
          <div className={`rounded-md px-3 py-2 text-sm ${notificationClass} mb-3`}>
            {notification.message}
          </div>
        ) : null}
      </div>
      {hasRequests ? (
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              <th className="text-left">Nome</th>
              <th className="text-left">Email</th>
              <th className="text-left">Mensagem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const isLoading = loadingIds.includes(request.id);
              return (
                <tr key={request.id} className="border-t border-gray-200">
                  <td className="py-2">{request.name}</td>
                  <td className="py-2">{request.email}</td>
                  <td className="py-2 text-sm text-muted-foreground">{request.message}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isLoading}
                        onClick={() => handleAction('approve', request.id)}
                      >
                        {actionLabel('approve', isLoading)}
                      </button>
                      <button
                        type="button"
                        className="btn"
                        disabled={isLoading}
                        onClick={() => handleAction('reject', request.id)}
                      >
                        {actionLabel('reject', isLoading)}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>Nenhuma solicitação pendente.</p>
      )}
    </>
  );
}
