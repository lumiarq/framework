import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Route, clearRegisteredRoutes } from '@illumiarq/http';
import { getContext } from '../src/context/index.js';
import { boot } from '../src/boot.js';

const logger = {
  debug: vi.fn(async () => undefined),
  info: vi.fn(async () => undefined),
  warn: vi.fn(async () => undefined),
  error: vi.fn(async () => undefined),
};

vi.mock('../src/discovery/discover-modules.js', () => ({
  discoverModules: vi.fn(async () => new Map()),
}));

vi.mock('../src/config/load-logging.js', () => ({
  loadLoggingConfig: vi.fn(async () => ({
    driver: 'console',
    default: 'console',
    channels: { console: { driver: 'console' } },
  })),
}));

vi.mock('../src/logging/init-logger.js', () => ({
  initializeRuntimeLogger: vi.fn(() => logger),
}));

describe('boot', () => {
  beforeEach(() => {
    clearRegisteredRoutes();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearRegisteredRoutes();
  });

  it('creates request ALS context for booted routes and bridges logger calls', async () => {
    Route.get(
      '/boot-test',
      async () => {
        const context = getContext();
        context.logger.info('boot-handler', { feature: 'boot-test' });
        return new Response(JSON.stringify({ contextId: context.contextId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
      { render: 'dynamic' },
    );

    const app = await boot();
    const response = await app.router.fetch(
      new Request('http://localhost/boot-test', {
        method: 'GET',
        headers: { 'x-request-id': 'boot-request-id' },
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ contextId: 'boot-request-id' });
    expect(logger.info).toHaveBeenCalledWith('boot-handler', {
      contextId: 'boot-request-id',
      feature: 'boot-test',
    });
  });
});
