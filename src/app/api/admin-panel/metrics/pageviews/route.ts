import { NextRequest } from 'next/server';
import { pageviewEvents } from '../../_data';
import { isModuleActive, json, parsePagination } from '../../_utils';

export async function GET(request: NextRequest) {
  if (!isModuleActive('admin-analytics')) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const { page, pageSize } = parsePagination(searchParams, 15);
  const route = searchParams.get('route');
  const userId = searchParams.get('userId');
  const device = searchParams.get('device');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let items = pageviewEvents;
  if (route) items = items.filter((e) => e.route === route);
  if (userId) items = items.filter((e) => e.userId === userId);
  if (device) items = items.filter((e) => e.device === device);
  if (from) items = items.filter((e) => new Date(e.createdAt).getTime() >= new Date(from).getTime());
  if (to) items = items.filter((e) => new Date(e.createdAt).getTime() <= new Date(to).getTime());

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return json({ items: paged, total, page, pageSize });
}
