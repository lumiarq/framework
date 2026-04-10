/**
 * Executes fn up to `times` total attempts (not retries).
 * Throws last error on final failure.
 */
export async function retry(times, fn, options) {
  const delay = options?.delay ?? 0;
  const backoff = options?.backoff ?? 1;
  const jitter = options?.jitter ?? false;
  const onRetry = options?.onRetry;
  let lastError;
  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isLastAttempt = attempt === times;
      if (isLastAttempt) break;
      // Notify caller before sleeping
      onRetry?.(lastError, attempt);
      // Compute sleep duration
      if (delay > 0) {
        const retryIndex = attempt - 1; // 0-based retry count
        let sleepMs = delay * Math.pow(backoff, retryIndex);
        if (jitter) {
          // ±10% uniform jitter: multiply by a factor in [0.9, 1.1]
          const factor = 1 + (Math.random() - 0.5) * 0.2;
          sleepMs = sleepMs * factor;
        }
        await new Promise((resolve) => setTimeout(resolve, sleepMs));
      }
    }
  }
  throw lastError;
}
//# sourceMappingURL=retry.js.map
