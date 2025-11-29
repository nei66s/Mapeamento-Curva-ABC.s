import { NextRequest } from 'next/server';
import { pageviewEvents } from '../../_data';
import { isModuleActive, json } from '../../_utils';

export async function GET(request: NextRequest) {
  if (!isModuleActive('admin-analytics')) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const routeFilter = searchParams.get('route');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let items = pageviewEvents;
  if (routeFilter) items = items.filter((e) => e.route === routeFilter);
  if (from) items = items.filter((e) => new Date(e.createdAt).getTime() >= new Date(from).getTime());
  if (to) items = items.filter((e) => new Date(e.createdAt).getTime() <= new Date(to).getTime());

  const buckets = new Map<string, number>();
  items.forEach((e) => {
    const date = new Date(e.createdAt);
    date.setMinutes(0, 0, 0);
    const key = date.toISOString();
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });

  const series = Array.from(buckets.entries())
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return json(series);
}
