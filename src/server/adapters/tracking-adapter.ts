import pool from '@/lib/db';

export async function insertTrackingEvent(event: { user_id?: string | null; route: string; device?: string; browser?: string }) {
  const res = await pool.query('insert into tracking_events(user_id, route, device, browser, created_at) values ($1,$2,$3,$4, now()) returning id, user_id, route, device, browser, created_at', [event.user_id || null, event.route, event.device || null, event.browser || null]);
  return res.rows[0];
}

export async function getTrackingStats(sinceMinutes = 60) {
  const res = await pool.query('select route, count(*) as hits from tracking_events where created_at >= now() - ($1 || \' minutes\')::interval group by route order by hits desc', [sinceMinutes]);
  return res.rows;
}
