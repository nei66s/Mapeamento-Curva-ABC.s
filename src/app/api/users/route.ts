export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { listUsers, createUser, updateUser, deleteUser } from '@/server/adapters/users-adapter';

type UpdatePayload = {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  role?: string;
  supplierId?: string | null;
  department?: string | null;
  password?: string | null;
};

export async function GET() {
  try {
    // reuse adapter listUsers (defaults to limit=50, offset=0)
    const rows = await listUsers();
    // adapter returns DB rows with no password by select; ensure we don't leak password
    const safe = rows.map((r: any) => {
      const { password, password_hash, ...rest } = r || {};
      return rest;
    });
    // response is normalized and returned to clients
    return NextResponse.json(safe);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role = 'admin', avatarUrl, supplierId, department, password = '' } = body;
    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios.' }, { status: 400 });
    }

    const created = await createUser({ name, email, password_hash: password || null, role });
    const { password_hash: _ph, password: _pw, ...safe } = created || ({} as any);
    return NextResponse.json(safe, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body: UpdatePayload = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

    const patch: any = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.email !== undefined) patch.email = updates.email;
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.password !== undefined) patch.password_hash = updates.password;
    if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
    if (updates.supplierId !== undefined) patch.supplier_id = updates.supplierId;
    if (updates.department !== undefined) patch.department = updates.department;

    const updated = await updateUser(id, patch);
    if (!updated) return NextResponse.json({ error: 'Usuário não encontrado ou nada para atualizar' }, { status: 404 });

    const { password_hash: _ph, password: _pw, ...safe } = updated as any;
    return NextResponse.json(safe);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });
    const ok = await deleteUser(id);
    if (!ok) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
