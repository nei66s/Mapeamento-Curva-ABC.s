export const runtime = 'nodejs';

import { json } from '../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import pool from '@/lib/db';

export async function GET() {
  const mod = await getModuleByKey('admin-health');
  if (mod && !mod.is_active) return json({ message: 'Módulo de health inativo.' }, 403);
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    let ok = false;
    try {
      const r = await pool.query('SELECT 1 as ok');
      ok = r.rows?.[0]?.ok === 1;
    } catch (e) {
      ok = false;
    }

    // try to read recent errors metric from metrics_cache
    let lastErrors: any[] = [];
    try {
      const er = await pool.query("select metric_key, metric_value from metrics_cache where metric_key ilike '%error%' limit 1");
      if (er.rowCount) {
        const v = er.rows[0].metric_value;
        if (Array.isArray(v)) lastErrors = v;
        else if (v && typeof v === 'object' && v.lastErrors) lastErrors = v.lastErrors;
      }
    } catch (e) {
      // ignore
    }

    const snapshot = {
      status: ok ? 'healthy' : 'degraded',
      uptimeSeconds,
      version: process.env.npm_package_version || process.env.APP_VERSION || 'unknown',
      dependencies: [
        { name: 'mapeamento', status: ok ? 'healthy' : 'down', lastChecked: new Date().toISOString(), latencyMs: 0 },
      ],
      lastErrors,
    };
    return json(snapshot);
  } catch (e) {
    return json({ message: 'Erro ao montar snapshot de health' }, 500);
  }
}
