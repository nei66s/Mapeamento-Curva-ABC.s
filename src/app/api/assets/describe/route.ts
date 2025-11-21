import { NextResponse } from 'next/server';
import { runGenerateAssetMetadata } from '@/ai/flows/generate-asset-metadata.server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetName, storeName, patrimony, hierarchy } = body || {};
    if (!assetName) {
      return NextResponse.json({ error: 'Informe o nome do ativo para gerar insumos e componentes.' }, { status: 400 });
    }
    const metadata = await runGenerateAssetMetadata({ assetName, storeName, patrimony, hierarchy });
    return NextResponse.json(metadata);
  } catch (err) {
    console.error('POST /api/assets/describe error', err);
    const errorMessage = (err as any)?.message ?? 'Erro na geração de IA.';
    return NextResponse.json(
      { error: 'Não foi possível gerar metadados com IA.', componentInsights: errorMessage, insumos: [], componentes: [] },
      { status: 503 }
    );
  }
}
