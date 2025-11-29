import { isModuleActive, json } from '../../_utils';
import { pageviewEvents, healthSnapshot } from '../../_data';

export async function GET() {
  if (!isModuleActive('admin-analytics')) return json({ message: 'Módulo de analytics inativo.' }, 403);
  const now = Date.now();
  const last5m = pageviewEvents.filter((e) => now - new Date(e.createdAt).getTime() <= 5 * 60 * 1000);
  const last1h = pageviewEvents.filter((e) => now - new Date(e.createdAt).getTime() <= 60 * 60 * 1000);
  const last24h = pageviewEvents.filter((e) => now - new Date(e.createdAt).getTime() <= 24 * 60 * 60 * 1000);

  const unique = (events: typeof pageviewEvents) => new Set(events.map((e) => e.userId || e.sessionId || e.id)).size;
  const groupByRoute = (events: typeof pageviewEvents) => {
    const map = new Map<string, number>();
    events.forEach((e) => map.set(e.route, (map.get(e.route) || 0) + 1));
    return Array.from(map.entries()).map(([route, count]) => ({ route, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  };
  const groupDevices = (events: typeof pageviewEvents) => {
    const map = new Map<string, number>();
    events.forEach((e) => map.set(e.device || 'desconhecido', (map.get(e.device || 'desconhecido') || 0) + 1));
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  };

  return json({
    activeUsers5m: unique(last5m),
    activeUsers1h: unique(last1h),
    activeUsers24h: unique(last24h),
    currentSessions: unique(last1h),
    rpm: Math.round((last5m.length / 5) * 10) / 10,
    errorsPerMinute: healthSnapshot.lastErrors.length > 0 ? 0.3 : 0,
    errorsLast24h: healthSnapshot.lastErrors.length,
    topRoutes: groupByRoute(last24h),
    deviceSplit: groupDevices(last24h),
  });
}
