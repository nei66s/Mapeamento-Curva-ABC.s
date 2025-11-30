import { NextRequest } from 'next/server';
import { json } from '../../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import * as metricsAdapter from '@/server/adapters/metrics-adapter';

export async function GET(request: NextRequest) {
  const mod = await getModuleByKey('admin-analytics');
  if (mod && !mod.is_active) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const routeFilter = searchParams.get('route');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    const rows = await metricsAdapter.getTimeseries('pageviews', 24);
    if (!rows || !rows.length) return json([]);
    const first = rows[0];
    const value = first.metric_value || first.value || first.metricValue;
    if (!Array.isArray(value)) return json([]);
    let series = value.map((p: any) => ({ timestamp: p.timestamp, value: p.value }));
    if (from) series = series.filter((p: any) => new Date(p.timestamp).getTime() >= new Date(from).getTime());
    if (to) series = series.filter((p: any) => new Date(p.timestamp).getTime() <= new Date(to).getTime());
    if (routeFilter) series = series.filter((s: any) => !routeFilter || String(s.route || '') === routeFilter);
    return json(series);
  } catch (e) {
    return json([]);
  }
}
