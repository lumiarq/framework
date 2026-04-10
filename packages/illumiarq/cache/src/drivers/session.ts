import type { CacheContract } from '@illumiarq/contracts';

/**
 * Session cache driver — backed by a plain Record<string,unknown> that lives for
 * the duration of a single request/response cycle.  Passed in as the session store.
 *
 * v1 stub: no serialisation, no TTL enforcement.
 * Suitable for per-request caching (loader results, computed values).
 */
export class SessionCacheDriver implements CacheContract {
  constructor(
    private readonly session: Record<string, unknown>,
    private readonly prefix = '_cache:',
  ) {}

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.session[this.key(key)] as T) ?? null;
  }

  async set<T>(key: string, value: T, _ttl?: number): Promise<void> {
    this.session[this.key(key)] = value;
  }

  async forget(key: string): Promise<void> {
    delete this.session[this.key(key)];
  }

  async remember<T>(key: string, _ttl: number, fn: () => Promise<T>): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) return existing;
    const value = await fn();
    await this.set(key, value);
    return value;
  }
}
