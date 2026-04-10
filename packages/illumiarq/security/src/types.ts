/**
 * Core middleware types for @illumiarq/security.
 * Structurally identical to the copies in @illumiarq/runtime — TypeScript
 * structural typing ensures full compatibility between the two.
 */

export type MiddlewareFn = (req: Request, next: () => Promise<Response>) => Promise<Response>;

export interface SessionData {
  [key: string]: unknown;
}

export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>;
  set(sessionId: string, data: SessionData, ttlSeconds: number): Promise<void>;
  destroy(sessionId: string): Promise<void>;
}

export interface CorsOptions {
  origin: string | string[] | '*';
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyFn?: (req: Request) => string;
}
