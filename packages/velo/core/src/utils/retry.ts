export interface RetryOptions {
  delay?: number; // ms before first retry (default: 0)
  backoff?: number; // exponential multiplier (default: 1)
  jitter?: boolean; // add ±10% random jitter to delay (default: false)
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Executes fn up to `times` total attempts (not retries).
 * Throws last error on final failure.
 */
export async function retry<T>(
  times: number,
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const delay = options?.delay ?? 0;
  const backoff = options?.backoff ?? 1;
  const jitter = options?.jitter ?? false;
  const onRetry = options?.onRetry;

  let lastError: Error | undefined;

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

        await new Promise<void>((resolve) => setTimeout(resolve, sleepMs));
      }
    }
  }

  throw lastError;
}
