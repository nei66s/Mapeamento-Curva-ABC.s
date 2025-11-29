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

  const map = new Map<string, number>();
  items.forEach((e) => map.set(e.route, (map.get(e.route) || 0) + 1));
  const topRoutes = Array.from(map.entries())
    .map(([route, count]) => ({ route, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  return json(topRoutes);
}
