export interface SessionData {
  [key: string]: unknown;
}

export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttlSeconds: number): Promise<void>;
  destroy(sessionId: string): Promise<void>;
}

// In-memory session store for v1 (swap for Redis/CF KV in v2)
export class InMemorySessionStore implements SessionStore {
  private readonly store = new Map<string, { data: SessionData; expiresAt: number }>();

  async get(sessionId: string): Promise<SessionData | null> {
    const entry = this.store.get(sessionId);
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(sessionId);
      return null;
    }
    return entry.data;
  }

  async set(sessionId: string, data: SessionData, ttlSeconds: number): Promise<void> {
    this.store.set(sessionId, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async destroy(sessionId: string): Promise<void> {
    this.store.delete(sessionId);
  }
}
