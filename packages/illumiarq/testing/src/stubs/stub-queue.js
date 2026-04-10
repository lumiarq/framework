export class StubQueue {
  logger;
  constructor(opts) {
    this.logger = opts.logger;
  }
  async dispatch(job, options) {
    this.logger.debug('[StubQueue] dispatch', {
      job: job.name,
      queue: options?.queue ?? 'default',
      data: job.data,
    });
  }
  async later(job, seconds, options) {
    this.logger.debug('[StubQueue] later', {
      job: job.name,
      delay: seconds,
      queue: options?.queue ?? 'default',
      data: job.data,
    });
  }
}
//# sourceMappingURL=stub-queue.js.map
