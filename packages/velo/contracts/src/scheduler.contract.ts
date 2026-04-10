export type CronExpression = string;

export interface ScheduleOptions {
  timezone?: string | undefined;
  runInBackground?: boolean | undefined;
  description?: string | undefined;
}

export interface ScheduledJob {
  /** Name of the Action (derived from function name or action metadata). */
  action: string;
  cron: CronExpression;
  options: ScheduleOptions;
  nextRunAt: Date;
  lastRunAt: Date | null;
  lastStatus: 'success' | 'failed' | 'pending' | null;
}

/**
 * SchedulerContract — job scheduling.
 * StubScheduler — registers jobs, execute via lumis schedule:run.
 *
 * The `action` parameter is typed as `unknown` to keep this package
 * zero-dependency. Pass a value returned by `defineAction()`.
 * The scheduler extracts the action name via `.name` property or function name.
 */
export interface SchedulerContract {
  call(action: unknown, cron: CronExpression, options?: ScheduleOptions): void;
  jobs(): ScheduledJob[];
  due(now?: Date): ScheduledJob[];
}
