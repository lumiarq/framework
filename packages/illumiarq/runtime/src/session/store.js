// In-memory session store for v1 (swap for Redis/CF KV in v2)
export class InMemorySessionStore {
  store = new Map();
  async get(sessionId) {
    const entry = this.store.get(sessionId);
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(sessionId);
      return null;
    }
    return entry.data;
  }
  async set(sessionId, data, ttlSeconds) {
    this.store.set(sessionId, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
  async destroy(sessionId) {
    this.store.delete(sessionId);
  }
}
//# sourceMappingURL=store.js.map
