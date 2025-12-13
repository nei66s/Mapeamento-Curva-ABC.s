export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import {
  listAssetRecords,
  createAssetRecord,
  updateAssetRecord,
  AssetRecordInput,
} from '@/lib/assets.server';

export async function GET() {
  try {
    const assets = await listAssetRecords();
    return NextResponse.json(assets);
  } catch (err) {
    console.error('GET /api/assets error', err);
    return NextResponse.json({ error: 'Não foi possível carregar os ativos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AssetRecordInput;
    if (!body.name || !body.storeName) {
      return NextResponse.json({ error: 'Nome do ativo e loja são obrigatórios' }, { status: 400 });
    }
    const created = await createAssetRecord({
      ...body,
      insumos: body.insumos ?? [],
      componentes: body.componentes ?? [],
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/assets error', err);
    return NextResponse.json({ error: 'Falha ao cadastrar o ativo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID do ativo é obrigatório' }, { status: 400 });
    }
    const updated = await updateAssetRecord(id, {
      ...data,
      insumos: data.insumos ?? undefined,
      componentes: data.componentes ?? undefined,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Ativo não encontrado' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/assets error', err);
    return NextResponse.json({ error: 'Falha ao atualizar o ativo' }, { status: 500 });
  }
}
