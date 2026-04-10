export class StubCache {
  store = new Map();
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
  async set(key, value, ttl) {
    this.store.set(key, {
      value,
      expiresAt: ttl !== undefined ? Date.now() + ttl * 1000 : null,
    });
  }
  async forget(key) {
    this.store.delete(key);
  }
  async remember(key, ttl, fn) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }
}
//# sourceMappingURL=stub-cache.js.map
