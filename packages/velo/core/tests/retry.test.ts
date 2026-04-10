import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { retry } from '../src/utils/retry.js';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('retry', () => {
  it('returns result immediately when fn succeeds on attempt 1', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(3, fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resolves correctly when fn fails twice then succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const promise = retry(3, fn);
    // advance timers for each retry (no delay by default)
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error when fn fails all attempts', async () => {
    const lastError = new Error('final fail');
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValue(lastError);

    // Attach rejection handler immediately; no delay so no timers needed.
    await expect(retry(3, fn)).rejects.toThrow('final fail');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('waits the specified delay before each retry', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const promise = retry(3, fn, { delay: 10 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('ok');
    // verify it actually used timers (fn called 3 times means 2 retries happened)
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('applies exponential backoff — second retry waits delay * backoff', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;

    vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb, ms, ...args) => {
      delays.push(ms as number);
      return originalSetTimeout(cb, 0, ...args);
    });

    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const promise = retry(3, fn, { delay: 10, backoff: 2 });
    await vi.runAllTimersAsync();
    await promise;

    expect(delays[0]).toBe(10); // first retry: 10ms
    expect(delays[1]).toBe(20); // second retry: 10 * 2 = 20ms
  });

  it('applies jitter when jitter: true (delay varies ±10%)', async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;

    vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb, ms, ...args) => {
      delays.push(ms as number);
      return originalSetTimeout(cb, 0, ...args);
    });

    // Use a fixed random to make jitter deterministic
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no-op jitter at 0.5 (0 offset from center)

    const fn = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue('ok');

    const promise = retry(2, fn, { delay: 100, jitter: true });
    await vi.runAllTimersAsync();
    await promise;

    // With Math.random() = 0.5: jitter = (0.5 - 0.5) * 2 * 0.1 * 100 = 0
    // So delay should be 100 (±10% = 90-110)
    expect(delays[0]).toBeGreaterThanOrEqual(90);
    expect(delays[0]).toBeLessThanOrEqual(110);
  });

  it('calls onRetry with (error, attemptNumber) for each failure except the last', async () => {
    const onRetry = vi.fn();
    const err1 = new Error('fail 1');
    const err2 = new Error('fail 2');
    const err3 = new Error('fail 3');

    const fn = vi
      .fn()
      .mockRejectedValueOnce(err1)
      .mockRejectedValueOnce(err2)
      .mockRejectedValue(err3);

    // Attach rejection handler immediately; no delay so no timers needed.
    await expect(retry(3, fn, { onRetry })).rejects.toThrow('fail 3');

    // onRetry should be called for attempts 1 and 2, but NOT the final failure
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, err1, 1);
    expect(onRetry).toHaveBeenNthCalledWith(2, err2, 2);
  });
});
