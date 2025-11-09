import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const r = await pool.query('SELECT 1 AS ok');
    const ok = r.rows?.[0]?.ok === 1;
    // Get some basic context for debugging
    const env = {
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'postgres',
      port: Number(process.env.PGPORT || 5432),
    };
    return NextResponse.json({ status: ok ? 'ok' : 'error', ok, env });
  } catch (err: any) {
    console.error('DB health error', err?.message || err);
    return NextResponse.json({ status: 'error', error: String(err?.message || err) }, { status: 500 });
  }
}

