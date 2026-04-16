import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_LOGGING_CONFIG_PATH = 'config/logging.ts';
export const MIDDLEWARE_BOOTSTRAP_PATH = 'bootstrap/middleware.ts';
export const WORKER_BOOTSTRAP_PATH = 'bootstrap/worker.ts';

export type ScaffoldFile = {
  path: string;
  content: string;
};

export function createDefaultLoggingConfigSource(): string {
  return `export default {
  level: 'info',
  default: 'console',
  prettify: process.env.NODE_ENV !== 'production',
  channels: {
    console: {
      driver: 'console',
    },
  },
} as const;
`;
}

/**
 * bootstrap/middleware.ts — register custom middleware here.
 *
 * Import your middleware files so they call defineMiddleware() before boot() runs.
 * Framework built-ins (lumiarq.auth, lumiarq.csrf, lumiarq.throttle) are registered
 * automatically — you only need this file for your own custom middleware.
 *
 * @example
 * import { defineMiddleware } from '@lumiarq/framework';
 * defineMiddleware({ name: 'myapp.tenant', handler: tenantMiddleware, priority: 50 });
 */
export function createMiddlewareBootstrapSource(): string {
  return `// Register custom application middleware here.
// Built-in LumiARQ middleware (lumiarq.auth, lumiarq.csrf, lumiarq.throttle)
// are registered automatically — only add your own custom middleware below.
//
// Example:
// import { defineMiddleware } from '@lumiarq/framework';
// import { tenantMiddleware } from '../src/shared/middleware/tenant.middleware';
//
// defineMiddleware({
//   name: 'myapp.tenant',
//   handler: tenantMiddleware,
//   priority: 50,
// });
`;
}

/**
 * bootstrap/worker.ts — background worker entrypoint.
 *
 * Runs BullMQ workers and the CronScheduler in a separate process.
 * Start with: lumis worker:start  (production) or lumis dev (development — auto-started)
 *
 * Uncomment the relevant sections once you have installed bullmq / node-cron
 * and configured config/queue.ts / config/schedule.ts.
 */
export function createWorkerBootstrapSource(): string {
  return `// Background worker entrypoint — BullMQ workers + CronScheduler.
// Start this process separately from the HTTP server:
//   Development: lumis dev  (auto-started alongside the HTTP server)
//   Production:  lumis worker:start
//
// Uncomment sections below as you enable each feature.

import './env.js';

// ─── Queue workers (BullMQ) ──────────────────────────────────────────────────
// Requires: pnpm add bullmq ioredis
// Configure: config/queue.ts  (driver: 'bullmq')
//
// import { BullMQWorker } from '@lumiarq/framework/runtime';
// import { env } from './env.js';
//
// const worker = new BullMQWorker({
//   connection: { host: env.REDIS_HOST, port: Number(env.REDIS_PORT ?? 6379) },
//   queues: ['default', 'mail'],
//   handlers: new Map([
//     ['mail.send', async (_name, data) => {
//       // handle queued mail jobs
//     }],
//   ]),
// });
//
// await worker.start();
// console.log('[worker] BullMQ workers started');

// ─── Cron scheduler ──────────────────────────────────────────────────────────
// Requires: pnpm add node-cron
//
// import { CronScheduler } from '@lumiarq/framework/runtime';
//
// export const schedule = new CronScheduler();
//
// import '../bootstrap/schedule.js'; // register jobs in bootstrap/schedule.ts
//
// await schedule.start();
// console.log('[worker] Cron scheduler started');

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// process.on('SIGTERM', async () => {
//   await worker.stop();
//   schedule.stop();
//   process.exit(0);
// });
`;
}

export function getDefaultScaffoldFiles(): ScaffoldFile[] {
  return [
    {
      path: DEFAULT_LOGGING_CONFIG_PATH,
      content: createDefaultLoggingConfigSource(),
    },
    {
      path: MIDDLEWARE_BOOTSTRAP_PATH,
      content: createMiddlewareBootstrapSource(),
    },
    {
      path: WORKER_BOOTSTRAP_PATH,
      content: createWorkerBootstrapSource(),
    },
  ];
}

export function writeScaffoldFiles(projectRoot: string, files: ScaffoldFile[]): void {
  for (const file of files) {
    const absolutePath = path.join(projectRoot, file.path);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, file.content, 'utf8');
  }
}
