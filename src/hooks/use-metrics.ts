'use client';

import { useQuery } from '@tanstack/react-query';
import { MetricsService, type MetricsFilters } from '@/services/metrics-service';
import type { RealtimeUsage, PageviewEvent, TopRouteStat, HeatmapBucket, TimeSeriesPoint, Paginated } from '@/types/admin';
import { appConfig } from '@/lib/config';

export function useRealtimeMetrics() {
  return useQuery<RealtimeUsage, Error>({
    queryKey: ['metrics', 'realtime'],
    queryFn: MetricsService.realtime,
    refetchInterval: appConfig.realtimePollInterval,
    refetchIntervalInBackground: true,
    // To move from polling to WebSocket/EventSource, replace refetchInterval with a subscription in a useEffect.
  } as any);
}

export function usePageviews(filters: MetricsFilters = {}) {
  return useQuery<Paginated<PageviewEvent>, Error>({
    queryKey: ['metrics', 'pageviews', filters],
    queryFn: () => MetricsService.pageviews(filters),
    keepPreviousData: true,
  } as any);
}

export function useTopRoutes(filters: MetricsFilters = {}) {
  return useQuery<TopRouteStat[], Error>({
    queryKey: ['metrics', 'top-routes', filters],
    queryFn: () => MetricsService.topRoutes(filters),
  } as any);
}

export function useHeatmap(filters: MetricsFilters = {}) {
  return useQuery<HeatmapBucket[], Error>({
    queryKey: ['metrics', 'heatmap', filters],
    queryFn: () => MetricsService.heatmap(filters),
  } as any);
}

export function useTimeseries(filters: MetricsFilters = {}) {
  return useQuery<TimeSeriesPoint[], Error>({
    queryKey: ['metrics', 'timeseries', filters],
    queryFn: () => MetricsService.timeseries(filters),
  } as any);
}
