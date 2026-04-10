// ─── Shared types ──────────────────────────────────────────────────────────────

export interface AuditAttempt {
  action: string;
  actorId: string | null;
  actorType: string;
  input: Record<string, unknown>;
  requestId: string | null;
  startedAt: Date;
}

export interface AuditSuccess {
  auditId: string;
  resultSummary: Record<string, unknown> | null;
  durationMs: number;
}

export interface AuditFailure {
  auditId: string;
  error: string;
  durationMs: number;
}

export interface AuditEntry {
  id: string;
  action: string;
  actorId: string | null;
  actorType: string;
  input: string;
  resultSummary: string | null;
  status: 'success' | 'failure' | 'attempt';
  error: string | null;
  durationMs: number;
  requestId: string | null;
  startedAt: Date;
}

export interface AuditFilters {
  action?: string;
  actorId?: string;
  actorType?: string;
  status?: AuditEntry['status'];
  from?: Date;
  to?: Date;
  limit?: number;
}

// ─── Contract ─────────────────────────────────────────────────────────────────

export interface AuditContract {
  recordAttempt(entry: AuditAttempt): Promise<string>;
  recordSuccess(entry: AuditSuccess): Promise<void>;
  recordFailure(entry: AuditFailure): Promise<void>;
  query(filters: AuditFilters): Promise<AuditEntry[]>;
}

// ─── In-memory test implementation ────────────────────────────────────────────

export interface TestAuditSink extends AuditContract {
  readonly attempts: AuditAttempt[];
  readonly outcomes: Array<AuditSuccess | AuditFailure>;
  clear(): void;
}

/**
 * Creates an in-memory audit sink for use in tests.
 * No database writes — all records are assertable via `sink.attempts` and `sink.outcomes`.
 */
export function createTestAudit(): TestAuditSink {
  const attempts: AuditAttempt[] = [];
  const outcomes: Array<AuditSuccess | AuditFailure> = [];
  let seq = 0;

  return {
    get attempts() {
      return attempts;
    },
    get outcomes() {
      return outcomes;
    },
    clear() {
      attempts.length = 0;
      outcomes.length = 0;
    },
    async recordAttempt(entry) {
      attempts.push(entry);
      return `audit-${++seq}`;
    },
    async recordSuccess(entry) {
      outcomes.push(entry);
    },
    async recordFailure(entry) {
      outcomes.push(entry);
    },
    async query() {
      return [];
    },
  };
}
