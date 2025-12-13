export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const run = promisify(exec);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const inferior = Number(body?.inferior ?? 200);
    const entre = Number(body?.entre ?? 200);

    // Run the scripted seeder using ts-node to keep logic in one place
    const cmd = `npx ts-node scripts/seed-lancamentos-targeted.ts --inferior ${inferior} --entre ${entre}`;
    const { stdout, stderr } = await run(cmd, { timeout: 120000 });
    return NextResponse.json({ ok: true, stdout, stderr });
  } catch (err: any) {
    console.error('seed-targeted error', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
