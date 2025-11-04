import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
  const destDir = path.join(process.cwd(), 'public', 'uploads', safeDest);
  const filePath = path.join(destDir, fileName);

  // Garante que a pasta de destino exista (cria recursivamente se necessário)
  await mkdir(destDir, { recursive: true });

  // Salva o arquivo
  await writeFile(filePath, buffer);

  // Retorna a URL pública do arquivo (pasta categories)
  const imageUrl = `/uploads/categories/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o upload do arquivo.' },
      { status: 500 }
    );
  }
}