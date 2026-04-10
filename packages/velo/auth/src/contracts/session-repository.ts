/**
 * Session repository contract.
 * Implement this interface in your application's database layer.
 */
export interface Session {
  id: string;
  userId: string;
  tokenHash: string; // SHA-256 hash of the raw session token — never stored raw
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateSessionData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<Session>;
  findByToken(tokenHash: string): Promise<Session | null>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
