/**
 * Session cache driver — backed by a plain Record<string,unknown> that lives for
 * the duration of a single request/response cycle.  Passed in as the session store.
 *
 * v1 stub: no serialisation, no TTL enforcement.
 * Suitable for per-request caching (loader results, computed values).
 */
export class SessionCacheDriver {
  session;
  prefix;
  constructor(session, prefix = '_cache:') {
    this.session = session;
    this.prefix = prefix;
  }
  key(k) {
    return `${this.prefix}${k}`;
  }
  async get(key) {
    return this.session[this.key(key)] ?? null;
  }
  async set(key, value, _ttl) {
    this.session[this.key(key)] = value;
  }
  async forget(key) {
    delete this.session[this.key(key)];
  }
  async remember(key, _ttl, fn) {
    const existing = await this.get(key);
    if (existing !== null) return existing;
    const value = await fn();
    await this.set(key, value);
    return value;
  }
}
//# sourceMappingURL=session.js.map
