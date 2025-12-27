import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { listAudit } from '@/server/adapters/audit-adapter';

export const runtime = 'nodejs';

function normalizeAudit(row: any) {
  return {
    id: `audit:${row.id}`,
    type: 'audit',
    user_id: row.user_id ?? null,
    action: row.action,
    entity: row.entity,
    entity_id: row.entity_id,
    metadata: { before: row.before_data, after: row.after_data, ip: row.ip, user_agent: row.user_agent },
    created_at: row.created_at,
  };
}

function normalizeTracking(row: any) {
  return {
    id: `track:${row.id}`,
    type: 'tracking',
    user_id: row.user_id ?? null,
    action: row.route,
    metadata: { device: row.device, browser: row.browser },
    created_at: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get('page') ?? '0'));
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? '50')));
    const offset = page * limit;
    const typesParam = (url.searchParams.get('types') || 'both').split(',').map(s => s.trim()).filter(Boolean);
    const userFilter = url.searchParams.get('user') ?? undefined;
    const sinceMinutes = url.searchParams.get('sinceMinutes') ? Number(url.searchParams.get('sinceMinutes')) : undefined;

    // Fetch audits and tracking with optional filters
    const needAudit = typesParam.includes('both') || typesParam.includes('audit');
    const needTracking = typesParam.includes('both') || typesParam.includes('tracking');

    const whereClausesAudit: string[] = [];
    const paramsAudit: any[] = [];
    if (userFilter) {
      paramsAudit.push(userFilter);
      whereClausesAudit.push(`user_id = $${paramsAudit.length}`);
    }
    if (sinceMinutes && Number.isFinite(sinceMinutes) && sinceMinutes > 0) {
      paramsAudit.push(sinceMinutes);
      whereClausesAudit.push(`created_at >= now() - ($${paramsAudit.length} || ' minutes')::interval`);
    }
    const whereAuditSql = whereClausesAudit.length ? `where ${whereClausesAudit.join(' and ')}` : '';

    const whereClausesTrack: string[] = [];
    const paramsTrack: any[] = [];
    if (userFilter) {
      paramsTrack.push(userFilter);
      whereClausesTrack.push(`user_id = $${paramsTrack.length}`);
    }
    if (sinceMinutes && Number.isFinite(sinceMinutes) && sinceMinutes > 0) {
      paramsTrack.push(sinceMinutes);
      whereClausesTrack.push(`created_at >= now() - ($${paramsTrack.length} || ' minutes')::interval`);
    }
    const whereTrackSql = whereClausesTrack.length ? `where ${whereClausesTrack.join(' and ')}` : '';

    const [auditRows, trackingRows, counts] = await Promise.all([
      needAudit
        ? pool.query(`select id, user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at from audit_logs ${whereAuditSql} order by created_at desc limit $${paramsAudit.length + 1} offset $${paramsAudit.length + 2}`, [...paramsAudit, limit * 2, 0]).then(r => r.rows)
        : Promise.resolve([]),
      needTracking
        ? pool.query(`select id, user_id, route, device, browser, created_at from tracking_events ${whereTrackSql} order by created_at desc limit $${paramsTrack.length + 1} offset $${paramsTrack.length + 2}`, [...paramsTrack, limit * 2, 0]).then(r => r.rows)
        : Promise.resolve([]),
      Promise.all([
        pool.query(`select count(*)::int as c from audit_logs ${whereAuditSql}`, paramsAudit).then(r => r.rows[0].c),
        pool.query(`select count(*)::int as c from tracking_events ${whereTrackSql}`, paramsTrack).then(r => r.rows[0].c),
      ]),
    ]);

    const auditItems = (auditRows || []).map(normalizeAudit);
    const trackingItems = (trackingRows || []).map(normalizeTracking);

    // merge and sort by created_at desc
    const merged = [...auditItems, ...trackingItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const pageItems = merged.slice(offset, offset + limit);

    const total = (counts && counts[0] != null && counts[1] != null) ? counts[0] + counts[1] : pageItems.length;

    return NextResponse.json({ events: pageItems, page, limit, total });
  } catch (err: any) {
    console.error('[admin/activity] error', err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
