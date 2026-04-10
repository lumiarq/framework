import { getContext } from '@velo/context';
export class StubAudit {
  verbose;
  log = [];
  seq = 0;
  constructor(opts) {
    this.verbose = opts.verbose;
  }
  async recordAttempt(entry) {
    const id = `audit-${++this.seq}`;
    let requestId = entry.requestId;
    try {
      const ctx = getContext();
      requestId ??= ctx.contextId ?? null;
    } catch {
      /* no context */
    }
    const record = {
      id,
      action: entry.action,
      actorId: entry.actorId,
      actorType: entry.actorType,
      input: JSON.stringify(entry.input),
      resultSummary: null,
      status: 'attempt',
      error: null,
      durationMs: 0,
      requestId,
      startedAt: entry.startedAt,
    };
    this.log.push(record);
    if (this.verbose) {
      console.log('[StubAudit] attempt', { id, action: entry.action, actor: entry.actorId });
    }
    return id;
  }
  async recordSuccess(entry) {
    const record = this.log.find((r) => r.id === entry.auditId);
    if (record) {
      record.status = 'success';
      record.resultSummary = entry.resultSummary ? JSON.stringify(entry.resultSummary) : null;
      record.durationMs = entry.durationMs;
    }
    if (this.verbose) {
      console.log('[StubAudit] success', { id: entry.auditId, durationMs: entry.durationMs });
    }
  }
  async recordFailure(entry) {
    const record = this.log.find((r) => r.id === entry.auditId);
    if (record) {
      record.status = 'failure';
      record.error = entry.error;
      record.durationMs = entry.durationMs;
    }
    if (this.verbose) {
      console.log('[StubAudit] failure', { id: entry.auditId, error: entry.error });
    }
  }
  async query(filters) {
    return this.log
      .filter((r) => {
        if (filters.action && r.action !== filters.action) return false;
        if (filters.actorId && r.actorId !== filters.actorId) return false;
        if (filters.actorType && r.actorType !== filters.actorType) return false;
        if (filters.status && r.status !== filters.status) return false;
        if (filters.from && r.startedAt < filters.from) return false;
        if (filters.to && r.startedAt > filters.to) return false;
        return true;
      })
      .slice(0, filters.limit ?? this.log.length);
  }
}
//# sourceMappingURL=stub-audit.js.map
