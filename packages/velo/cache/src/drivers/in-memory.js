/**
 * In-memory cache driver — values stored in a Map, no TTL enforcement (v1 stub).
 * Suitable for development and testing. Not shared across processes.
 */
export class InMemoryCacheDriver {
  store = new Map();
  async get(key) {
    return this.store.get(key) ?? null;
  }
  async set(key, value, _ttl) {
    this.store.set(key, value);
  }
  async forget(key) {
    this.store.delete(key);
  }
  async remember(key, _ttl, fn) {
    const existing = await this.get(key);
    if (existing !== null) return existing;
    const value = await fn();
    await this.set(key, value);
    return value;
  }
  /** Clears all keys (useful in tests) */
  flush() {
    this.store.clear();
  }
}
//# sourceMappingURL=in-memory.js.map
