import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado.' },
        { status: 400 }
      );
    }

    // Valida o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Por favor, envie apenas arquivos de imagem.' },
        { status: 400 }
      );
    }

    // Gera um nome único para o arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = path.extname(file.name);
    const fileName = uuidv4() + fileExt;

    // Allow clients to request a destination folder (e.g. 'items' or 'categories')
    const requestedDest = String(formData.get('dest') || 'categories');
    const safeDest = requestedDest.replace(/[^a-z0-9-_]/gi, '').toLowerCase() || 'categories';

    // Whether to store in DB instead of filesystem. Default: filesystem
    const store = String(formData.get('store') || 'fs'); // 'fs' or 'db'
    const userId = formData.get('userId') ? String(formData.get('userId')) : null;

    let dbColumnMissing = false;
    if (store === 'db') {
      if (!userId) {
        return NextResponse.json({ error: 'Para store=db é necessário enviar userId.' }, { status: 400 });
      }

      // Save bytes into users table (requires migration adding avatar_data/avatar_mime)
      try {
        await pool.query(
          `UPDATE users SET avatar_data = $1, avatar_mime = $2 WHERE id = $3`,
          [buffer, file.type || null, userId]
        );

        // Return a URL that the client can later request to fetch the avatar from DB
        const imageUrl = `/api/users/avatar?id=${encodeURIComponent(userId)}`;
        return NextResponse.json({ imageUrl });
      } catch (err: any) {
        // If the DB doesn't have the required columns (Postgres error code 42703),
        // fall back to filesystem storage so uploads still work without migration.
        if (err?.code === '42703') {
          dbColumnMissing = true;
          console.warn('DB missing avatar_data/avatar_mime columns; falling back to filesystem. Run sql/001-add-avatar-bytea.sql to enable DB storage.');
        } else {
          console.error('Error saving upload to DB:', err);
          return NextResponse.json({ error: 'Erro ao salvar imagem no banco de dados.' }, { status: 500 });
        }
      }
    }

    const destDir = path.join(process.cwd(), 'public', 'uploads', safeDest);
    const filePath = path.join(destDir, fileName);

    // Garante que a pasta de destino exista (cria recursivamente se necessário)
    await mkdir(destDir, { recursive: true });

    // Salva o arquivo
    await writeFile(filePath, buffer);

    // Retorna a URL pública do arquivo (usa a pasta solicitada de forma segura)
    const imageUrl = `/uploads/${safeDest}/${fileName}`;

    if (dbColumnMissing) {
      // Inform client that DB storage was not possible and we fell back to filesystem
      console.warn('Returned filesystem imageUrl because DB columns were missing.');
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o upload do arquivo.' },
      { status: 500 }
    );
  }
}