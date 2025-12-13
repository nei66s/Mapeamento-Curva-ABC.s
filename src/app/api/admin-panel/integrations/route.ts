export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { json } from '../_utils';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { listApiKeys, createApiKey, deleteApiKey } from '@/server/adapters/api-keys-adapter';
import { getModuleByKey } from '@/server/adapters/modules-adapter';

function getAccessToken(request: NextRequest) {
  return (
    request.cookies.get('pm_access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')
  );
}

function requireAuthenticatedUser(request: NextRequest) {
  const token = getAccessToken(request);
  const verified = verifyAccessToken(token);
  if (!verified.valid) return null;
  return verified.userId;
}

async function ensureModuleActive() {
  const module = await getModuleByKey('admin-integrations');
  if (module && !module.active) {
    return json({ message: 'Módulo de integrações inativo.' }, 403);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const moduleErr = await ensureModuleActive();
  if (moduleErr) return moduleErr;
  const userId = requireAuthenticatedUser(request);
  if (!userId) return json({ message: 'Não autenticado.' }, 401);
  const items = await listApiKeys();
  return json({ items });
}

export async function POST(request: NextRequest) {
  const moduleErr = await ensureModuleActive();
  if (moduleErr) return moduleErr;
  const userId = requireAuthenticatedUser(request);
  if (!userId) return json({ message: 'Não autenticado.' }, 401);
  const body = await request.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) return json({ message: 'Informe um nome para a integração.' }, 400);
  let expiresAt: string | null = null;
  if (body.expiresAt) {
    const parsed = new Date(body.expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      return json({ message: 'Data de expiração inválida.' }, 400);
    }
    expiresAt = parsed.toISOString();
  }
  try {
    const result = await createApiKey({ userId, name, expiresAt });
    return json({ item: result.record, key: result.secret }, 201);
  } catch (error: any) {
    console.error('Failed to create API key', error);
    return json({ message: error?.message || 'Erro ao gerar chave de API.' }, 500);
  }
}

export async function DELETE(request: NextRequest) {
  const moduleErr = await ensureModuleActive();
  if (moduleErr) return moduleErr;
  const userId = requireAuthenticatedUser(request);
  if (!userId) return json({ message: 'Não autenticado.' }, 401);
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return json({ message: 'id obrigatório.' }, 400);
  const ok = await deleteApiKey(id);
  if (!ok) return json({ message: 'Chave não encontrada.' }, 404);
  return json({ ok: true });
}
