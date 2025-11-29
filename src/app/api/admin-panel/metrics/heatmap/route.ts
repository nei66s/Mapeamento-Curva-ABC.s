import { NextRequest } from 'next/server';
import { pageviewEvents } from '../../_data';
import { isModuleActive, json } from '../../_utils';

export async function GET(request: NextRequest) {
  if (!isModuleActive('admin-analytics')) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  let items = pageviewEvents;
  if (from) items = items.filter((e) => new Date(e.createdAt).getTime() >= new Date(from).getTime());
  if (to) items = items.filter((e) => new Date(e.createdAt).getTime() <= new Date(to).getTime());

  const buckets: Record<number, number> = {};
  items.forEach((e) => {
    const hour = new Date(e.createdAt).getHours();
    buckets[hour] = (buckets[hour] || 0) + 1;
  });

  const heatmap = Array.from({ length: 24 }).map((_, hour) => ({
    hour,
    count: buckets[hour] || 0,
  }));

  return json(heatmap);
}
