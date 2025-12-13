import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    const ok = r.rows?.[0]?.ok === 1;
    const env = {
      databaseUrl: Boolean(process.env.DATABASE_URL),
    };
    return NextResponse.json({ status: ok ? 'ok' : 'error', ok, env });
  } catch (err: any) {
    console.error('DB health error', err?.message || err);
    return NextResponse.json({ status: 'error', error: String(err?.message || err) }, { status: 500 });
  }
}
