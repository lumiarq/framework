/**
 * CronScheduler — real cron-based scheduler using node-cron.
 *
 * Node.js only. Requires `node-cron`:
 *   pnpm add node-cron
 *   pnpm add -D @types/node-cron
 *
 * Replaces StubScheduler in production. Use in bootstrap/worker.ts:
 *   import { CronScheduler } from '@lumiarq/framework/runtime';
 *   export const schedule = new CronScheduler();
 *
 * Register jobs in bootstrap/schedule.ts (same API as StubScheduler):
 *   schedule.call(GenerateSitemapAction, '0 2 * * *', { description: 'Nightly sitemap' })
 *
 * Then start the scheduler:
 *   schedule.start();
 */
import type {
  SchedulerContract,
  ScheduledJob,
  CronExpression,
  ScheduleOptions,
} from '@illumiarq/contracts';

interface NodeCronTask {
  start(): void;
  stop(): void;
}

interface NodeCronModule {
  schedule(
    expression: string,
    fn: () => void | Promise<void>,
    options?: { scheduled?: boolean; timezone?: string },
  ): NodeCronTask;
  validate(expression: string): boolean;
}

async function loadNodeCron(): Promise<NodeCronModule> {
  try {
    return (await import('node-cron')) as unknown as NodeCronModule;
  } catch {
    throw new Error(
      '[CronScheduler] node-cron is not installed. Run: pnpm add node-cron && pnpm add -D @types/node-cron',
    );
  }
}

function getActionName(action: unknown): string {
  if (typeof action === 'function') return (action as { name?: string }).name || 'AnonymousAction';
  if (action && typeof action === 'object' && 'name' in action) {
    return String((action as { name: unknown }).name) || 'AnonymousAction';
  }
  return 'AnonymousAction';
}

interface RegistrationEntry {
  action: unknown;
  name: string;
  cron: CronExpression;
  options: ScheduleOptions;
  task: NodeCronTask | null;
  lastRunAt: Date | null;
  lastStatus: 'success' | 'failed' | 'pending' | null;
}

export class CronScheduler implements SchedulerContract {
  private readonly _jobs: RegistrationEntry[] = [];
  private started = false;

  call(action: unknown, cron: CronExpression, options: ScheduleOptions = {}): void {
    if (!cron || typeof cron !== 'string') {
      throw new Error(`[CronScheduler] Invalid cron expression: ${String(cron)}`);
    }
    const name = getActionName(action);
    this._jobs.push({
      action,
      name,
      cron,
      options,
      task: null,
      lastRunAt: null,
      lastStatus: 'pending',
    });
  }

  /**
   * Start all registered cron jobs.
   * Call this once from bootstrap/worker.ts after all jobs are registered.
   */
  async start(): Promise<void> {
    if (this.started) return;
    const cron = await loadNodeCron();

    for (const entry of this._jobs) {
      const task = cron.schedule(
        entry.cron,
        async () => {
          entry.lastRunAt = new Date();
          try {
            // Execute the action — supports both plain functions and defineAction() results
            const action = entry.action;
            if (typeof action === 'function') {
              await (action as () => Promise<void>)();
            } else if (
              action &&
              typeof action === 'object' &&
              'execute' in action &&
              typeof (action as { execute: unknown }).execute === 'function'
            ) {
              await (action as { execute: () => Promise<void> }).execute();
            }
            entry.lastStatus = 'success';
          } catch (err) {
            entry.lastStatus = 'failed';
            console.error(`[CronScheduler] Job "${entry.name}" failed:`, err);
          }
        },
        {
          scheduled: true,
          ...(entry.options.timezone ? { timezone: entry.options.timezone } : {}),
        },
      );
      entry.task = task;
    }
    this.started = true;
  }

  /** Stop all running cron tasks. */
  stop(): void {
    for (const entry of this._jobs) {
      entry.task?.stop();
    }
    this.started = false;
  }

  jobs(): ScheduledJob[] {
    return this._jobs.map((entry) => ({
      action: entry.name,
      cron: entry.cron,
      options: entry.options,
      nextRunAt: computeNextRun(entry.cron),
      lastRunAt: entry.lastRunAt,
      lastStatus: entry.lastStatus,
    }));
  }

  due(now: Date = new Date()): ScheduledJob[] {
    // Return jobs that are past their computed next run time
    return this.jobs().filter((job) => job.nextRunAt <= now);
  }

  /** Run a specific job immediately by name (for lumis schedule:run). */
  async runByName(name: string): Promise<void> {
    const entry = this._jobs.find((j) => j.name === name);
    if (!entry) throw new Error(`[CronScheduler] No job found with name "${name}"`);
    const action = entry.action;
    if (typeof action === 'function') {
      await (action as () => Promise<void>)();
    } else if (
      action &&
      typeof action === 'object' &&
      'execute' in action &&
      typeof (action as { execute: unknown }).execute === 'function'
    ) {
      await (action as { execute: () => Promise<void> }).execute();
    }
    entry.lastRunAt = new Date();
    entry.lastStatus = 'success';
  }
}

/** Naive next-run computation — for display purposes only. */
function computeNextRun(_cron: CronExpression): Date {
  const next = new Date();
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
}
