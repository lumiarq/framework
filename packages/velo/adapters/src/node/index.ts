import { createServer } from 'node:net';
import type { Hono } from 'hono';

const DEFAULT_PORT = 4000;
const DEFAULT_HOSTNAME = '0.0.0.0';
const DEFAULT_MAX_PORT_ATTEMPTS = 20;

export interface NodeAdapterOptions {
  /** Port to listen on (default: 3000) */
  port?: number;
  /** Hostname to bind (default: '0.0.0.0') */
  hostname?: string;
  /** Automatically use the next available port when the requested one is occupied (default: true) */
  autoPortFallback?: boolean;
  /** Maximum number of ports to try when autoPortFallback is enabled (default: 20) */
  maxPortAttempts?: number;
}

async function isPortAvailable(port: number, hostname: string): Promise<boolean> {
  return await new Promise<boolean>((resolve, reject) => {
    const probe = createServer();

    probe.once('error', (error: NodeJS.ErrnoException) => {
      probe.close();

      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });

    probe.once('listening', () => {
      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(true);
      });
    });

    probe.listen(port, hostname);
  });
}

async function resolveListenPort(
  requestedPort: number,
  hostname: string,
  autoPortFallback: boolean,
  maxPortAttempts: number,
): Promise<number> {
  const attempts = autoPortFallback ? Math.max(1, maxPortAttempts) : 1;

  for (let offset = 0; offset < attempts; offset += 1) {
    const candidate = requestedPort + offset;
    const available = await isPortAvailable(candidate, hostname);

    if (available) {
      return candidate;
    }
  }

  if (!autoPortFallback) {
    throw new Error(
      `Port ${requestedPort} is already in use on ${hostname}. Stop the existing process or choose a different port.`,
    );
  }

  const endPort = requestedPort + attempts - 1;
  throw new Error(
    `No available port found on ${hostname} in range ${requestedPort}-${endPort}.`,
  );
}

function normalizeMaxPortAttempts(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_MAX_PORT_ATTEMPTS;
  }

  return Math.trunc(value);
}

/**
 * Starts a Node.js HTTP server from a Hono app.
 * Uses Node's built-in http module — no additional server dependency.
 *
 * @param app     - The Hono application instance
 * @param options - Server configuration
 */
export async function startNodeServer(app: Hono, options: NodeAdapterOptions = {}): Promise<void> {
  const { serve } = await import('@hono/node-server');
  const {
    port = DEFAULT_PORT,
    hostname = DEFAULT_HOSTNAME,
    autoPortFallback = true,
    maxPortAttempts = DEFAULT_MAX_PORT_ATTEMPTS,
  } = options;

  const resolvedPort = await resolveListenPort(
    port,
    hostname,
    autoPortFallback,
    normalizeMaxPortAttempts(maxPortAttempts),
  );
  if (resolvedPort !== port) {
    console.warn(
      `[lumiarq] Port ${port} is in use on ${hostname}. Using nearest available port ${resolvedPort}.`,
    );
  }

  serve({ fetch: app.fetch, port: resolvedPort, hostname });
  console.info(`[lumiarq] Server started on http://${hostname}:${resolvedPort}`);
}
