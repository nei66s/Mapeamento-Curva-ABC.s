import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { stat, unlink } from 'fs/promises';
import { getUserById, updateUser } from '@/lib/users.server';

function isSafeUploadPath(urlPath: string): boolean {
  // Only allow files under /uploads and forbid path traversal
  if (!urlPath.startsWith('/uploads/')) return false;
  if (urlPath.includes('..')) return false;
  return true;
}

async function deleteIfExists(fullPath: string) {
  try {
    await stat(fullPath);
  } catch {
    return; // doesn't exist; nothing to do
  }
  try {
    await unlink(fullPath);
  } catch (err) {
    // log and continue; we still clear DB field
    console.warn('Failed to delete avatar file', { fullPath, err });
  }
}

// DELETE /api/users/avatar?id=<userId>
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

    const existing = await getUserById(id);
    if (!existing) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

    const avatarUrl = existing.avatarUrl || '';
    if (avatarUrl && isSafeUploadPath(avatarUrl)) {
      const full = path.join(process.cwd(), 'public', avatarUrl);
      await deleteIfExists(full);
    }

  const updated = await updateUser(id, { avatarUrl: null } as any);
    if (!updated) return NextResponse.json({ error: 'Não foi possível atualizar o usuário' }, { status: 500 });
    const { password, ...safe } = updated as any;
    return NextResponse.json(safe);
  } catch (error) {
    console.error('Erro ao remover foto do perfil:', error);
    return NextResponse.json({ error: 'Erro ao remover foto do perfil' }, { status: 500 });
  }
}
