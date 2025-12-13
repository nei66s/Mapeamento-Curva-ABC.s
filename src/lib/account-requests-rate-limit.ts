const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;

const rateLimitStore = new Map<
  string,
  {
    count: number;
    expiresAt: number;
  }
>();

export function ensureRateLimit(clientKey: string) {
  const now = Date.now();
  const existing = rateLimitStore.get(clientKey);
  if (!existing || existing.expiresAt <= now) {
    rateLimitStore.set(clientKey, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (existing.count >= RATE_LIMIT_MAX) return false;
  existing.count += 1;
  return true;
}

export function resetAccountRequestsRateLimit() {
  rateLimitStore.clear();
}
