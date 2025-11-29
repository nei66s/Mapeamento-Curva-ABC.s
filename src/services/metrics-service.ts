import { apiClient } from '@/lib/api-client';
import type {
  RealtimeUsage,
  TimeSeriesPoint,
  TopRouteStat,
  PageviewEvent,
  Paginated,
  HeatmapBucket,
} from '@/types/admin';

export type MetricsFilters = {
  from?: string;
  to?: string;
  route?: string;
  userId?: string;
  device?: string;
  page?: number;
  pageSize?: number;
};

export const MetricsService = {
  realtime: () => apiClient.get<RealtimeUsage>('/admin/metrics/realtime', { cache: 'no-store' }),
  pageviews: (filters: MetricsFilters = {}) =>
    apiClient.get<Paginated<PageviewEvent>>('/admin/metrics/pageviews', { query: filters }),
  topRoutes: (filters: MetricsFilters = {}) =>
    apiClient.get<TopRouteStat[]>('/admin/metrics/top-routes', { query: filters }),
  heatmap: (filters: MetricsFilters = {}) =>
    apiClient.get<HeatmapBucket[]>('/admin/metrics/heatmap', { query: filters }),
  timeseries: (filters: MetricsFilters = {}) =>
    apiClient.get<TimeSeriesPoint[]>('/admin/metrics/timeseries', { query: filters }),
};
