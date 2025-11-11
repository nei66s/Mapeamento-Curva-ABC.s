export function toggleFollowHelper(
  watchIdRef: { current: number | null },
  startWatch: (success: PositionCallback, error?: PositionErrorCallback, opts?: PositionOptions) => number,
  clearWatch: (id: number) => void,
  setFollowing: (v: boolean) => void,
  setBtnActive?: (active: boolean) => void
) {
  return () => {
    if (watchIdRef.current == null) {
      // start watching
      const id = startWatch(
        () => {},
        () => {},
        { enableHighAccuracy: true, maximumAge: 1000 }
      );
      watchIdRef.current = id as number;
      setFollowing(true);
      if (setBtnActive) setBtnActive(true);
    } else {
      try {
        clearWatch(watchIdRef.current as number);
      } catch (e) {}
      watchIdRef.current = null;
      setFollowing(false);
      if (setBtnActive) setBtnActive(false);
    }
  };
}
