/** Extracts the action name from a defineAction() result or a plain function. */
function getActionName(action) {
  if (typeof action === 'function') return action.name || 'AnonymousAction';
  if (action && typeof action === 'object' && 'name' in action) {
    return String(action.name) || 'AnonymousAction';
  }
  return 'AnonymousAction';
}
/**
 * Computes the next run time for a cron expression.
 * Stub implementation — always returns the next occurrence of the minute mark.
 * v2 uses a real cron parser.
 */
function computeNextRun(cron, _timezone) {
  // Stub: set next run to the next hour boundary for any cron
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1); // next minute
  return next;
  // Note: real implementation parses `cron` with a library (e.g. cron-parser)
}
export class StubScheduler {
  _jobs = [];
  /**
   * Registers a scheduled job.
   * Validates that cron is a non-empty string (does not parse it in v1 stub).
   * v2 validates full cron syntax and throws InvalidCronExpressionError.
   */
  call(action, cron, options = {}) {
    if (!cron || typeof cron !== 'string') {
      throw new Error(`[StubScheduler] Invalid cron expression: ${String(cron)}`);
    }
    const name = getActionName(action);
    this._jobs.push({ action, name, cron, options });
  }
  /** Returns all registered scheduled jobs with computed metadata. */
  jobs() {
    return this._jobs.map((entry) => ({
      action: entry.name,
      cron: entry.cron,
      options: entry.options,
      nextRunAt: computeNextRun(entry.cron, entry.options.timezone),
      lastRunAt: null,
      lastStatus: null,
    }));
  }
  /**
   * Returns jobs whose cron would run at or before `now`.
   * Stub: returns all registered jobs (always treated as due).
   * v2 uses a real cron parser to compute precise due jobs.
   */
  due(_now = new Date()) {
    // Stub: all jobs are considered due (safe for testing)
    return this.jobs();
  }
  /** Clears all registered jobs — useful in tests. */
  clearJobs() {
    this._jobs.length = 0;
  }
}
// Singleton StubScheduler instance.
// Import as `schedule` in bootstrap/schedule.ts.
//
// import { schedule } from '@velo/runtime';
// schedule.call(PruneExpiredSessionsAction, '*/15 * * * *')
export const schedule = new StubScheduler();
//# sourceMappingURL=stub-scheduler.js.map
