import type { CacheContract } from '@illumiarq/contracts';

/**
 * In-memory cache driver — values stored in a Map, no TTL enforcement (v1 stub).
 * Suitable for development and testing. Not shared across processes.
 */
export class InMemoryCacheDriver implements CacheContract {
  private readonly store = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }

  async set<T>(key: string, value: T, _ttl?: number): Promise<void> {
    this.store.set(key, value);
  }

  async forget(key: string): Promise<void> {
    this.store.delete(key);
  }

  async remember<T>(key: string, _ttl: number, fn: () => Promise<T>): Promise<T> {
    const existing = await this.get<T>(key);
    if (existing !== null) return existing;
    const value = await fn();
    await this.set(key, value);
    return value;
  }

  /** Clears all keys (useful in tests) */
  flush(): void {
    this.store.clear();
  }
}
