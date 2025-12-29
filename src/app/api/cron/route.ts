import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const auth = request.headers.get('authorization') || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  let client: any = null;
  let runId: string | null = null;

  try {
    client = await pool.connect();
  } catch (e) {
    // If we can't get a dedicated client, fall back to pool.query usage below
    console.warn('[cron] could not acquire client connection, will use pool.query', e);
  }

  const runner = client ?? pool;

  try {
    // Record run start if table exists
    try {
      const start = await runner.query(
        'INSERT INTO cron_runs (job_name, status, started_at) VALUES ($1, $2, now()) RETURNING id',
        ['cron', 'running']
      );
      runId = start?.rows?.[0]?.id ?? null;
    } catch (e) {
      // Table may not exist yet — warn and continue without persistent logging
      console.warn('[cron] failed to create cron_runs row (table missing?). Continuing without persistent logging.', e);
      runId = null;
    }

    // Actual work: minimal smoke-check. Replace with real tasks as needed.
    const res = await runner.query('SELECT now() as now');
    const ranAt = res?.rows?.[0]?.now ?? null;

    if (runId) {
      try {
        await runner.query('UPDATE cron_runs SET status=$1, ran_at=now(), payload=$2 WHERE id=$3', [
          'success',
          JSON.stringify({ ranAt }),
          runId,
        ]);
      } catch (e) {
        console.warn('[cron] failed to update cron_runs after success', e);
      }
    }

    return NextResponse.json({ ok: true, ranAt });
  } catch (err) {
    console.error('[cron] error', err);
    if (runId) {
      try {
        await runner.query('UPDATE cron_runs SET status=$1, error=$2 WHERE id=$3', ['failed', String(err), runId]);
      } catch (e) {
        console.warn('[cron] failed to update cron_runs after error', e);
      }
    }
    return new NextResponse(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  } finally {
    try {
      if (client) client.release();
    } catch (e) {
      // ignore
    }
  }
}
