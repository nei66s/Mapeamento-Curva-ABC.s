import pool from '@/lib/db';

export async function getRealtimeMetrics() {
  // Simple example: cached metrics + counts from tracking
  const cacheRes = await pool.query('select metric_key, metric_value, updated_at from metrics_cache');
  const trackingRes = await pool.query("select route, count(*) as hits from tracking_events where created_at >= now() - interval '15 minutes' group by route");
  return { cache: cacheRes.rows, pageviews: trackingRes.rows };
}

export async function getTimeseries(metricKey: string, hours = 24) {
  const res = await pool.query('select * from metrics_cache where metric_key = $1', [metricKey]);
  return res.rows;
}
