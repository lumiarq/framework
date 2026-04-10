// ─── Shared types ──────────────────────────────────────────────────────────────
/**
 * Creates an in-memory audit sink for use in tests.
 * No database writes — all records are assertable via `sink.attempts` and `sink.outcomes`.
 */
export function createTestAudit() {
  const attempts = [];
  const outcomes = [];
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
//# sourceMappingURL=audit.contract.js.map
