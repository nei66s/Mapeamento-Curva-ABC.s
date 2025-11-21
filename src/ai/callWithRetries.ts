export async function callWithRetries<T = any>(
  fn: () => Promise<T>,
  attempts = 6,
  baseDelay = 500,
  callTimeoutMs?: number
): Promise<T> {
  // Allow overriding retry behaviour via environment variables for dev/prod tuning
  const envAttempts = process.env.AI_RETRY_ATTEMPTS ? Number(process.env.AI_RETRY_ATTEMPTS) : undefined;
  const envBaseDelay = process.env.AI_RETRY_BASE_DELAY_MS ? Number(process.env.AI_RETRY_BASE_DELAY_MS) : undefined;
  const envTimeout = process.env.AI_CALL_TIMEOUT_MS ? Number(process.env.AI_CALL_TIMEOUT_MS) : undefined;

  const effectiveAttempts = typeof envAttempts === 'number' && !Number.isNaN(envAttempts) ? envAttempts : attempts;
  const effectiveBaseDelay = typeof envBaseDelay === 'number' && !Number.isNaN(envBaseDelay) ? envBaseDelay : baseDelay;
  const effectiveTimeout = typeof callTimeoutMs === 'number' && !Number.isNaN(callTimeoutMs) ? callTimeoutMs : (typeof envTimeout === 'number' && !Number.isNaN(envTimeout) ? envTimeout : 15000);
  const maxDelayMs = 30000; // cap for backoff

  let lastErr: any = null;
  for (let i = 0; i < effectiveAttempts; i++) {
    try {
      if (i > 0) console.debug(`AI call retry attempt ${i + 1}/${effectiveAttempts}`);

      // Run the call but enforce a per-call timeout to avoid long hanging promises
      const attemptNumber = i + 1;
      const startTs = Date.now();
      const callPromise = fn();
      const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`AI call timed out after ${effectiveTimeout}ms`)), effectiveTimeout));
      // eslint-disable-next-line no-await-in-loop
      const res = await Promise.race([callPromise, timeoutPromise]) as T;
      const took = Date.now() - startTs;
      console.info(`AI call succeeded on attempt ${attemptNumber}/${effectiveAttempts} in ${took}ms`);
      return res;
    } catch (e: any) {
      lastErr = e;
      const statusRaw = e?.status ?? e?.statusCode ?? e?.code ?? '';
      const statusCode = typeof statusRaw === 'number' ? statusRaw : Number(statusRaw) || undefined;
      const msg = String(e?.message ?? '').toLowerCase();

      const is5xx = typeof statusCode === 'number' && statusCode >= 500 && statusCode < 600;
      // Treat common network/503/429 and API overloaded responses as transient
      const isTransient = is5xx || statusCode === 429 || msg.includes('overloaded') || msg.includes('unavailable') || msg.includes('try again') || msg.includes('rate limit') || msg.includes('timed out') || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('socket hang up');

      if (!isTransient) {
        break;
      }

      if (i < effectiveAttempts - 1) {
        // If server provided a Retry-After, respect it when possible
        let retryAfterMs: number | undefined = undefined;
        try {
          const retryAfterHeader = e?.response?.headers?.get?.('retry-after') ?? e?.headers?.get?.('retry-after') ?? e?.retry_after ?? e?.headers?.['retry-after'];
          if (retryAfterHeader) {
            const secs = Number(String(retryAfterHeader).trim());
            if (!Number.isNaN(secs)) retryAfterMs = Math.max(0, Math.floor(secs * 1000));
          }
        } catch {/* ignore header parsing errors */}

        const expDelay = Math.min(maxDelayMs, effectiveBaseDelay * Math.pow(2, i));
        // Full jitter: pick a random delay between 0 and expDelay
        const jittered = Math.floor(Math.random() * expDelay);
        const delay = retryAfterMs ?? jittered;
        console.warn(`Transient AI error (status=${statusCode ?? 'unknown'}) - retrying in ${delay}ms (attempt ${i + 1}/${effectiveAttempts}): ${e?.message ?? e}`);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  // Final failure: wrap with metadata and throw so callers can log/use it
  const wrapped: any = new Error(lastErr?.message ?? 'AI call failed after retries');
  wrapped.meta = {
    attempts: effectiveAttempts,
    lastError: {
      message: lastErr?.message ?? String(lastErr),
      status: lastErr?.status ?? lastErr?.statusCode ?? lastErr?.code ?? undefined,
    },
  };
  console.error('AI call failed after retries', wrapped.meta);
  throw wrapped;
}
