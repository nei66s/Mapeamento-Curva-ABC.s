export const runtime = 'nodejs';

import { isModuleActive, json } from '../../_utils';
import * as metricsAdapter from '@/server/adapters/metrics-adapter';
import pool from '@/lib/db';

export async function GET() {
  if (!(await isModuleActive('admin-analytics'))) return json({ message: 'Módulo de analytics inativo.' }, 403);

  // DB-backed realtime
  try {
    const data = (await metricsAdapter.getRealtimeMetrics()) || {};
    const cache = Array.isArray(data.cache) ? data.cache : (data.cache ? [data.cache] : []);
    const pageviews = Array.isArray(data.pageviews) ? data.pageviews : (data.pageviews ? [data.pageviews] : []); // [{ route, hits }]

    // top routes from recent tracking (adapter returns hits per route)
    const topRoutes = (pageviews as any[]).map((r: any) => ({ route: r.route, count: Number(r.hits || r.count || r.c || 0) })).sort((a, b) => b.count - a.count).slice(0, 5);

    // device split: prefer cached metric, otherwise compute from tracking_events
    let deviceSplit: Array<{ label: string; value: number }> = [];
    const deviceRow = cache.find((c: any) => c.metric_key === 'device.split' || c.metric_key === 'device_split' || c.metric_key === 'devices');
    if (deviceRow && Array.isArray(deviceRow.metric_value)) {
      deviceSplit = deviceRow.metric_value.map((d: any) => ({ label: d.label || d.name, value: Number(d.value || d.count || 0) }));
    } else {
      const devRes = await pool.query("select coalesce(device, 'desconhecido') as device, count(*) as value from tracking_events where created_at >= now() - interval '24 hours' group by device order by value desc limit 10");
      deviceSplit = devRes.rows.map((r: any) => ({ label: r.device, value: Number(r.value) }));
    }

    // active users windows: try to read cached values or compute heuristically from tracking_events
    const active5mRow = cache.find((c: any) => c.metric_key === 'activeUsers5m');
    const active1hRow = cache.find((c: any) => c.metric_key === 'activeUsers1h');
    const active24hRow = cache.find((c: any) => c.metric_key === 'activeUsers24h');
    // tracking_events does not store a session_id column; count distinct known user_ids instead
    let activeUsers5m: number;
    if (active5mRow) {
      activeUsers5m = Number(active5mRow.metric_value || 0);
    } else {
      const res5 = await pool.query("select count(distinct user_id::text) filter (where user_id is not null) as c from tracking_events where created_at >= now() - interval '5 minutes'");
      activeUsers5m = Number((res5.rows && res5.rows[0] && res5.rows[0].c) || 0);
    }

    let activeUsers1h: number;
    if (active1hRow) {
      activeUsers1h = Number(active1hRow.metric_value || 0);
    } else {
      const res1 = await pool.query("select count(distinct user_id::text) filter (where user_id is not null) as c from tracking_events where created_at >= now() - interval '1 hour'");
      activeUsers1h = Number((res1.rows && res1.rows[0] && res1.rows[0].c) || 0);
    }

    let activeUsers24h: number;
    if (active24hRow) {
      activeUsers24h = Number(active24hRow.metric_value || 0);
    } else {
      const res24 = await pool.query("select count(distinct user_id::text) filter (where user_id is not null) as c from tracking_events where created_at >= now() - interval '24 hours'");
      activeUsers24h = Number((res24.rows && res24.rows[0] && res24.rows[0].c) || 0);
    }

    const rpmRow = cache.find((c: any) => c.metric_key === 'rpm');
    const rpm = rpmRow ? Number(rpmRow.metric_value || 0) : Math.round(((pageviews as any[]).reduce((acc: number, cur: any) => acc + Number(cur.hits || cur.count || 0), 0) / 5) * 10) / 10;

    // errors: try to find error counts in cache (metric_keys like 'errors.last24h')
    const errorsRow = cache.find((c: any) => String(c.metric_key).includes('error') || String(c.metric_key).includes('errors'));
    const errorsLast24h = errorsRow ? Number((errorsRow.metric_value && (errorsRow.metric_value.last24h || errorsRow.metric_value)) || 0) : 0;
    const errorsPerMinute = errorsLast24h > 0 ? Math.round((errorsLast24h / (24 * 60)) * 10) / 10 : 0;

    return json({ cache, pageviews, topRoutes, deviceSplit, activeUsers5m: Number(activeUsers5m), activeUsers1h: Number(activeUsers1h), activeUsers24h: Number(activeUsers24h), currentSessions: Number(activeUsers1h), rpm: Number(rpm), errorsPerMinute, errorsLast24h: Number(errorsLast24h) });
  } catch (e: any) {
    // log error to server console to aid debugging
    // include message in response to help local devs (avoid leaking in prod)
    console.error('[admin/metrics/realtime] error:', e && e.stack ? e.stack : e);
    return json({ message: 'Erro ao ler métricas em tempo real.', error: String(e && e.message ? e.message : e) }, 500);
  }
}
