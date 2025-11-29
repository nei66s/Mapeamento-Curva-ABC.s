import { render, screen } from '@testing-library/react';
import AnalyticsPage from '@/app/admin-panel/analytics/page';

vi.mock('@/hooks/use-metrics', () => ({
  usePageviews: () => ({
    data: { items: [{ id: 'pv-1', route: '/indicators', userId: 'u1', device: 'Web', browser: 'Chrome', createdAt: new Date().toISOString() }] },
  }),
  useTopRoutes: () => ({ data: [{ route: '/indicators', count: 12 }] }),
  useHeatmap: () => ({ data: [{ hour: 10, count: 4 }] }),
  useTimeseries: () => ({ data: [{ timestamp: new Date().toISOString(), value: 6 }] }),
}));

vi.mock('@/hooks/use-tracking', () => ({
  useTracking: () => ({ trackAction: vi.fn(), trackView: vi.fn() }),
}));

describe('AnalyticsPage', () => {
  it('renders analytics widgets and table', () => {
    render(<AnalyticsPage />);
    expect(screen.getByText('Métricas e Acessos')).toBeInTheDocument();
    expect(screen.getByText('Eventos de pageview')).toBeInTheDocument();
    expect(screen.getByText('Heatmap de horário')).toBeInTheDocument();
  });
});
