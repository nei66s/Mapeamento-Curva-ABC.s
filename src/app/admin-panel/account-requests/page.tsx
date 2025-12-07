import { listAccountRequests } from '@/lib/account-requests.server';
import AccountRequestsManager from './account-requests-manager';

export default async function AdminAccountRequestsPage() {
  // server-side: fetch pending requests
  const requests = await listAccountRequests();

  return (
    <div className="page-shell">
      <h1 className="text-2xl font-semibold mb-4">Solicitações de Conta</h1>
      <div className="space-y-3">
        <AccountRequestsManager initialRequests={requests} />
      </div>
    </div>
  );
}
