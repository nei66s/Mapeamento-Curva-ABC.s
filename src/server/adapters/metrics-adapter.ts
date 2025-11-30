import pool from '@/lib/db';

export async function getRealtimeMetrics() {
  // Read cached metrics and tracking counts
  const cacheRes = await pool.query('select metric_key, metric_value, updated_at from metrics_cache');
  const trackingRes = await pool.query("select route, count(*) as hits from tracking_events where created_at >= now() - interval '15 minutes' group by route");
  return { cache: cacheRes.rows, pageviews: trackingRes.rows };
}

export async function getTimeseries(metricKey: string, hours = 24) {
  const res = await pool.query('select * from metrics_cache where metric_key = $1 limit 1', [metricKey]);
  if (!res.rowCount) return [];
  // normalize returned row to expected shape
  const row = res.rows[0];
  const value = row.metric_value;
  if (Array.isArray(value)) return [{ ...row, metric_value: value }];
  // if metric_value is an object containing a `series` key, return that
  if (value && value.series && Array.isArray(value.series)) return [{ ...row, metric_value: value.series }];
  return [{ ...row, metric_value: value }];
}
