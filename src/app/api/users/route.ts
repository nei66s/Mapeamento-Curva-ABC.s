import { NextResponse } from 'next/server';
import { getUsers, createUser, updateUser, deleteUser } from '@/lib/users.server';

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
    const users = await getUsers();
    // Remove passwords before returning
    const safe = users.map(({ password, ...rest }) => rest);
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

  const created = await createUser({ name, email, role, password, avatarUrl, supplierId, department });
  // Avoid shadowing the earlier `password` variable by aliasing during destructure
  const { password: _omitted, ...safe } = created as any;
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

    const updated = await updateUser(id, updates as any);
    if (!updated) return NextResponse.json({ error: 'Usuário não encontrado ou nada para atualizar' }, { status: 404 });

    const { password, ...safe } = updated as any;
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
