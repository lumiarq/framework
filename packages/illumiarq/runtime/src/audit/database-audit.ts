/**
 * DatabaseAudit — persists audit records to the `audit_log` table via the LibSQL client.
 *
 * Uses raw SQL via the libsql client (`db.execute()`) so the runtime package does not
 * need a direct dependency on drizzle-orm. The table must be created via migration
 * using the schema in `src/shared/database/schemas/audit-log.schema.ts`.
 *
 * @example
 * // bootstrap/providers.ts
 * import { DatabaseAudit } from '@lumiarq/framework/runtime';
 * import { getConnection } from '@illumiarq/database';
 *
 * const db = getConnection();
 * export const audit = new DatabaseAudit({ db });
 */
import type {
  AuditContract,
  AuditAttempt,
  AuditSuccess,
  AuditFailure,
  AuditEntry,
  AuditFilters,
} from '@illumiarq/contracts';
import { getContext } from '@illumiarq/context';

// Minimal interface for the Drizzle LibSQL instance — uses `execute` for raw SQL.
interface RawDb {
  execute(
    sql: string | { sql: string; args: unknown[] },
  ): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface DatabaseAuditOptions {
  /** A Drizzle LibSQL database connection (`getConnection()` from @illumiarq/database). */
  db: RawDb;
}

function generateId(): string {
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class DatabaseAudit implements AuditContract {
  private readonly db: RawDb;

  constructor(opts: DatabaseAuditOptions) {
    this.db = opts.db;
  }

  async recordAttempt(entry: AuditAttempt): Promise<string> {
    const id = generateId();
    let requestId = entry.requestId;
    try {
      const ctx = getContext() as { contextId?: string };
      requestId ??= ctx.contextId ?? null;
    } catch {
      /* no context active */
    }

    await this.db.execute({
      sql: `INSERT INTO audit_log
              (id, action, actor_id, actor_type, input, result_summary, status, error, duration_ms, request_id, started_at)
            VALUES (?, ?, ?, ?, ?, NULL, 'attempt', NULL, 0, ?, ?)`,
      args: [
        id,
        entry.action,
        entry.actorId ?? null,
        entry.actorType ?? 'system',
        JSON.stringify(entry.input),
        requestId ?? null,
        Math.floor(entry.startedAt.getTime() / 1000),
      ],
    });

    return id;
  }

  async recordSuccess(entry: AuditSuccess): Promise<void> {
    await this.db.execute({
      sql: `UPDATE audit_log
            SET status = 'success',
                result_summary = ?,
                duration_ms = ?
            WHERE id = ?`,
      args: [
        entry.resultSummary ? JSON.stringify(entry.resultSummary) : null,
        entry.durationMs,
        entry.auditId,
      ],
    });
  }

  async recordFailure(entry: AuditFailure): Promise<void> {
    await this.db.execute({
      sql: `UPDATE audit_log
            SET status = 'failure',
                error = ?,
                duration_ms = ?
            WHERE id = ?`,
      args: [entry.error, entry.durationMs, entry.auditId],
    });
  }

  async query(filters: AuditFilters): Promise<AuditEntry[]> {
    const conditions: string[] = [];
    const args: unknown[] = [];

    if (filters.action) {
      conditions.push('action = ?');
      args.push(filters.action);
    }
    if (filters.actorId) {
      conditions.push('actor_id = ?');
      args.push(filters.actorId);
    }
    if (filters.actorType) {
      conditions.push('actor_type = ?');
      args.push(filters.actorType);
    }
    if (filters.status) {
      conditions.push('status = ?');
      args.push(filters.status);
    }
    if (filters.from) {
      conditions.push('started_at >= ?');
      args.push(Math.floor(filters.from.getTime() / 1000));
    }
    if (filters.to) {
      conditions.push('started_at <= ?');
      args.push(Math.floor(filters.to.getTime() / 1000));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit ?? 100;
    args.push(limit);

    const result = await this.db.execute({
      sql: `SELECT id, action, actor_id, actor_type, input, result_summary, status, error, duration_ms, request_id, started_at
            FROM audit_log
            ${where}
            ORDER BY started_at DESC
            LIMIT ?`,
      args,
    });

    return result.rows.map((row) => ({
      id: String(row['id']),
      action: String(row['action']),
      actorId: (row['actor_id'] as string | null) ?? null,
      actorType: String(row['actor_type'] ?? 'system'),
      input: String(row['input']),
      resultSummary: (row['result_summary'] as string | null) ?? null,
      status: (row['status'] as AuditEntry['status']) ?? 'attempt',
      error: (row['error'] as string | null) ?? null,
      durationMs: Number(row['duration_ms']),
      requestId: (row['request_id'] as string | null) ?? null,
      startedAt: new Date(Number(row['started_at']) * 1000),
    }));
  }
}
