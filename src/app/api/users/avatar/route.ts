export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { stat, unlink, readFile } from 'fs/promises';
import { getUserById, updateUser } from '@/lib/users.server';
import { updateUserProfilePreferences } from '@/server/adapters/users-adapter';
import pool from '@/lib/db';

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

    // Also clear any binary avatar stored in the DB
    try {
      await pool.query('UPDATE users SET avatar_data = NULL, avatar_mime = NULL WHERE id = $1', [id]);
    } catch (err) {
      console.warn('Failed to clear avatar_data/avatar_mime for user', id, err);
    }

    await updateUserProfilePreferences(id, { avatarUrl: null });
    const updated = await updateUser(id, { avatarUrl: null } as any);
    if (!updated) return NextResponse.json({ error: 'Não foi possível atualizar o usuário' }, { status: 500 });
    const { password, ...safe } = updated as any;
    return NextResponse.json(safe);
  } catch (error) {
    try { console.error('Erro ao remover foto do perfil:', error); } catch(_) {}
    const msg = (error as any)?.message || 'Erro ao remover foto do perfil';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/users/avatar?id=<userId>
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 });

    // Try to fetch binary avatar from DB first
    try {
      const res = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      if (res.rowCount > 0) {
        const row: any = res.rows[0];
        const data: Buffer | null = row.avatar_data ?? null;
        const mime: string | null = row.avatar_mime ?? null;

        if (data && mime) {
          return new NextResponse(new Uint8Array(data as Buffer), {
            status: 200,
            headers: {
              'Content-Type': mime,
            },
          });
        }

        // fallback to filesystem URL if present
        const avatarUrl = row.avatarurl || row.avatar_url || row.avatarUrl || '';
        if (avatarUrl && avatarUrl.startsWith('/uploads/') && !avatarUrl.includes('..')) {
          const full = path.join(process.cwd(), 'public', avatarUrl);
          try {
            const buffer = await readFile(full);
            // derive mime from extension
            const ext = path.extname(full).toLowerCase();
            const contentType =
              ext === '.png'
                ? 'image/png'
                : ext === '.svg'
                ? 'image/svg+xml'
                : ext === '.webp'
                ? 'image/webp'
                : ext === '.jpg' || ext === '.jpeg'
                ? 'image/jpeg'
                : 'application/octet-stream';
            return new NextResponse(new Uint8Array(buffer as Buffer), { status: 200, headers: { 'Content-Type': contentType } });
          } catch (err) {
            // fall through to 404
          }
        }
      }
    } catch (err) {
      console.error('Error fetching avatar from DB:', err);
    }

    return NextResponse.json({ error: 'Avatar não encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Erro ao responder GET /api/users/avatar:', error);
    return NextResponse.json({ error: 'Erro ao buscar avatar' }, { status: 500 });
  }
}
