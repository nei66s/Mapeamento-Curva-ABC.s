import { renderHook, act } from '@testing-library/react';
import { useTracking } from '@/hooks/use-tracking';

const trackEventMock = vi.fn();
const trackPageViewMock = vi.fn();

vi.mock('@/lib/tracking/client', () => ({
  trackEvent: (...args: any[]) => trackEventMock(...args),
  trackPageView: (...args: any[]) => trackPageViewMock(...args),
}));

vi.mock('@/lib/auth/store', () => ({
  useAuthStore: (selector: any) =>
    selector({
      user: { id: 'user-1' },
    }),
}));

describe('useTracking', () => {
  it('propaga userId nos eventos', () => {
    const { result } = renderHook(() => useTracking());
    act(() => result.current.trackAction('test-event', { ok: true }));
    expect(trackEventMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'test-event', userId: 'user-1' }));

    act(() => result.current.trackView('/rota'));
    expect(trackPageViewMock).toHaveBeenCalledWith('/rota', 'user-1');
  });
});
