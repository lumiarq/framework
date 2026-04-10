// ─── StubQueue — executes jobs synchronously in-process ──────────────────────
import type { QueueContract, JobPayload, DispatchOptions } from '@illumiarq/contracts';
import type { LoggerContract } from '@illumiarq/contracts';

export interface StubQueueOptions {
  logger: LoggerContract;
}

export class StubQueue implements QueueContract {
  private readonly logger: LoggerContract;

  constructor(opts: StubQueueOptions) {
    this.logger = opts.logger;
  }

  async dispatch(job: JobPayload, options?: DispatchOptions): Promise<void> {
    this.logger.debug('[StubQueue] dispatch', {
      job: job.name,
      queue: options?.queue ?? 'default',
      data: job.data,
    });
  }

  async later(
    job: JobPayload,
    seconds: number,
    options?: Omit<DispatchOptions, 'delay'>,
  ): Promise<void> {
    this.logger.debug('[StubQueue] later', {
      job: job.name,
      delay: seconds,
      queue: options?.queue ?? 'default',
      data: job.data,
    });
  }
}
