import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountRequestsManager from '../src/app/admin-panel/account-requests/account-requests-manager';
import type { AccountRequest } from '@/lib/account-requests.server';

const sampleRequests: AccountRequest[] = [
  {
    id: 'req-1',
    name: 'Solicitante Teste',
    email: 'teste@example.com',
    message: 'Preciso de acesso.',
    status: 'pending',
    requestedAt: '2024-01-01T00:00:00.000Z',
  },
];

describe('AccountRequestsManager', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('approves a request, removes the row and shows success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<AccountRequestsManager initialRequests={sampleRequests} />);

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));
    await waitFor(() => expect(screen.getByText('Solicitação aprovada.')).toBeInTheDocument());
    expect(screen.queryByText('Solicitante Teste')).not.toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin-panel/account-requests',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'approve', id: 'req-1' }),
      })
    );
  });

  it('keeps the request and surfaces an error when the API fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: 'erro de rede' }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<AccountRequestsManager initialRequests={sampleRequests} />);

    fireEvent.click(screen.getByRole('button', { name: /aprovar/i }));
    await waitFor(() => expect(screen.getByText('erro de rede')).toBeInTheDocument());
    expect(screen.getByText('Solicitante Teste')).toBeInTheDocument();
  });
});
