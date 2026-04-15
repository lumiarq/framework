import { createServer } from 'node:net';

async function assertPortAvailable(port, hostname) {
  await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', (error) => {
      probe.close();
      if (error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use on ${hostname}. Stop the existing process or choose a different port.`,
          ),
        );
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
        resolve();
      });
    });
    probe.listen(port, hostname);
  });
}

/**
 * Starts a Node.js HTTP server from a Hono app.
 * Uses Node's built-in http module — no additional server dependency.
 *
 * @param app     - The Hono application instance
 * @param options - Server configuration
 */
export async function startNodeServer(app, options = {}) {
  const { serve } = await import('@hono/node-server');
  const { port = 4000, hostname = '0.0.0.0' } = options;
  await assertPortAvailable(port, hostname);
  serve({ fetch: app.fetch, port, hostname });
  console.info(`[lumiarq] Server started on http://${hostname}:${port}`);
}
//# sourceMappingURL=index.js.map
