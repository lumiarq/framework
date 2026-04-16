/**
 * BullMQQueue — Redis-backed job queue driver using BullMQ.
 *
 * Node.js only. Requires a Redis server and the bullmq package:
 *   pnpm add bullmq ioredis
 *
 * Configure via config/queue.ts:
 *   driver: 'bullmq'
 *   bullmq: { host, port, password? }
 *
 * Worker entrypoint: bootstrap/worker.ts
 *   import { BullMQWorker } from '@lumiarq/framework/runtime';
 *   new BullMQWorker({ connection, queues: ['default','mail'] }).start();
 *
 * @example
 * // bootstrap/providers.ts
 * import { BullMQQueue } from '@lumiarq/framework/runtime';
 * export const queue = new BullMQQueue({ connection: { host: env.REDIS_HOST, port: 6379 } });
 */
import type { QueueContract, JobPayload, DispatchOptions } from '@illumiarq/contracts';

export interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface BullMQQueueOptions {
  connection: RedisConnectionOptions;
  defaultQueue?: string;
}

interface BullQueue {
  add(
    name: string,
    data: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<unknown>;
  close(): Promise<void>;
}

type QueueCtor = new (name: string, opts: Record<string, unknown>) => BullQueue;

async function loadQueue(): Promise<QueueCtor> {
  try {
    const bullmq = (await import('bullmq')) as unknown as { Queue: QueueCtor };
    return bullmq.Queue;
  } catch {
    throw new Error('[BullMQQueue] bullmq is not installed. Run: pnpm add bullmq ioredis');
  }
}

export class BullMQQueue implements QueueContract {
  private readonly opts: BullMQQueueOptions;
  private queues = new Map<string, BullQueue>();
  private QueueCtor: QueueCtor | null = null;

  constructor(opts: BullMQQueueOptions) {
    this.opts = opts;
  }

  private async getQueue(name: string): Promise<BullQueue> {
    if (!this.queues.has(name)) {
      if (!this.QueueCtor) {
        this.QueueCtor = await loadQueue();
      }
      const q = new this.QueueCtor(name, { connection: this.opts.connection });
      this.queues.set(name, q);
    }
    return this.queues.get(name)!;
  }

  async dispatch(job: JobPayload, options?: DispatchOptions): Promise<void> {
    const queueName = options?.queue ?? this.opts.defaultQueue ?? 'default';
    const q = await this.getQueue(queueName);
    await q.add(job.name, job.data, {
      delay: options?.delay ? options.delay * 1000 : undefined,
      attempts: options?.tries ?? 3,
      backoff: options?.backoff
        ? { type: 'exponential', delay: options.backoff * 1000 }
        : { type: 'exponential', delay: 5000 },
    });
  }

  async later(
    job: JobPayload,
    seconds: number,
    options?: Omit<DispatchOptions, 'delay'>,
  ): Promise<void> {
    return this.dispatch(job, { ...options, delay: seconds });
  }

  /** Close all queue connections. Call on graceful shutdown. */
  async close(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
    this.queues.clear();
  }
}

/**
 * BullMQWorker — runs BullMQ workers for one or more queues.
 *
 * Use in bootstrap/worker.ts:
 *   const worker = new BullMQWorker({ connection, queues: ['default','mail'], handlers });
 *   worker.start();
 */
interface WorkerCtor {
  new (
    name: string,
    processor: (job: { name: string; data: Record<string, unknown> }) => Promise<void>,
    opts: Record<string, unknown>,
  ): { close(): Promise<void> };
}

export type JobHandler = (name: string, data: Record<string, unknown>) => Promise<void>;

export interface BullMQWorkerOptions {
  connection: RedisConnectionOptions;
  queues: string[];
  /** Map of job name → handler function. Falls back to a console.warn if not found. */
  handlers?: Map<string, JobHandler>;
}

export class BullMQWorker {
  private readonly opts: BullMQWorkerOptions;
  private workers: Array<{ close(): Promise<void> }> = [];

  constructor(opts: BullMQWorkerOptions) {
    this.opts = opts;
  }

  async start(): Promise<void> {
    let Worker: WorkerCtor;
    try {
      const bullmq = (await import('bullmq')) as unknown as { Worker: WorkerCtor };
      Worker = bullmq.Worker;
    } catch {
      throw new Error('[BullMQWorker] bullmq is not installed. Run: pnpm add bullmq ioredis');
    }

    for (const queueName of this.opts.queues) {
      const worker = new Worker(
        queueName,
        async (job) => {
          const handler = this.opts.handlers?.get(job.name);
          if (handler) {
            await handler(job.name, job.data);
          } else {
            console.warn(
              `[BullMQWorker] No handler registered for job "${job.name}" on queue "${queueName}"`,
            );
          }
        },
        { connection: this.opts.connection },
      );
      this.workers.push(worker);
    }
  }

  async stop(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    this.workers = [];
  }
}
