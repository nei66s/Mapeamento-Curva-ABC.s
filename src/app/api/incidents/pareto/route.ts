import { NextResponse } from 'next/server';
import { getParetoItems, getParetoByTitle } from '@/lib/incidents.server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const group = (url.searchParams.get('group') || 'item').toLowerCase();
    const topParam = url.searchParams.get('top');
    const top = topParam ? Number.parseInt(topParam, 10) : 7;
    if (Number.isNaN(top) || top <= 0) return NextResponse.json({ error: 'invalid top' }, { status: 400 });

    if (group === 'title') {
      const rows = await getParetoByTitle(top);
      return NextResponse.json(rows);
    }

    // default: group by item
    const rows = await getParetoItems(top, 'item');
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /api/incidents/pareto error', err);
    if (process.env.NODE_ENV !== 'production') return NextResponse.json([]);
    return NextResponse.json({ error: 'Failed to compute pareto' }, { status: 500 });
  }
}
