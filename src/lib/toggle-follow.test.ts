import { describe, it, expect, vi } from 'vitest';
import { toggleFollowHelper } from './toggle-follow';

describe('toggleFollowHelper', () => {
  it('starts watching when no watch id present', () => {
    const watchIdRef: { current: number | null } = { current: null };
    const startWatch = vi.fn(() => 123);
    const clearWatch = vi.fn();
    const setFollowing = vi.fn();
    const setBtnActive = vi.fn();

    const toggle = toggleFollowHelper(watchIdRef, startWatch as any, clearWatch as any, setFollowing as any, setBtnActive as any);
    toggle();

    expect(startWatch).toHaveBeenCalled();
    expect(watchIdRef.current).toBe(123);
    expect(setFollowing).toHaveBeenCalledWith(true);
    expect(setBtnActive).toHaveBeenCalledWith(true);
  });

  it('clears watch when id present', () => {
    const watchIdRef: { current: number | null } = { current: 456 };
    const startWatch = vi.fn(() => 999);
    const clearWatch = vi.fn();
    const setFollowing = vi.fn();
    const setBtnActive = vi.fn();

    const toggle = toggleFollowHelper(watchIdRef, startWatch as any, clearWatch as any, setFollowing as any, setBtnActive as any);
    toggle();

    expect(clearWatch).toHaveBeenCalledWith(456);
    expect(watchIdRef.current).toBeNull();
    expect(setFollowing).toHaveBeenCalledWith(false);
    expect(setBtnActive).toHaveBeenCalledWith(false);
  });
});
