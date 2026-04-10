import { describe, it, expect, beforeEach } from 'vitest';
import { composeMiddleware } from '../src/middleware/pipeline.js';
import {
  defineMiddleware,
  getMiddleware,
  hasMiddleware,
  clearMiddlewareRegistry,
} from '../src/middleware/define-middleware.js';

describe('middleware pipeline', () => {
  it('runs middleware in order', async () => {
    const calls: string[] = [];

    const pipeline = composeMiddleware([
      async (_req, next) => {
        calls.push('a');
        const res = await next();
        calls.push('a:after');
        return res;
      },
      async (_req, next) => {
        calls.push('b');
        return next();
      },
    ]);

    const res = await pipeline(new Request('https://example.test'), async () => {
      calls.push('handler');
      return new Response('ok');
    });

    expect(await res.text()).toBe('ok');
    expect(calls).toEqual(['a', 'b', 'handler', 'a:after']);
  });
});

describe('middleware registry', () => {
  beforeEach(() => clearMiddlewareRegistry());

  it('registers a middleware by name', () => {
    defineMiddleware({ name: 'test.auth', handler: async (_req, next) => next(), priority: 10 });
    expect(hasMiddleware('test.auth')).toBe(true);
  });

  it('retrieves a registered middleware by name', () => {
    const handler = async (_req: Request, next: () => Promise<Response>) => next();
    defineMiddleware({ name: 'test.handler', handler, priority: 5 });
    const def = getMiddleware('test.handler');
    expect(def).toBeDefined();
    expect(def!.handler).toBe(handler);
    expect(def!.priority).toBe(5);
  });

  it('returns undefined for unknown middleware', () => {
    expect(getMiddleware('unknown.mw')).toBeUndefined();
  });

  it('overwrites middleware with the same name', () => {
    const first = async (_req: Request, next: () => Promise<Response>) => next();
    const second = async (_req: Request, next: () => Promise<Response>) => next();
    defineMiddleware({ name: 'test.dup', handler: first });
    defineMiddleware({ name: 'test.dup', handler: second });
    expect(getMiddleware('test.dup')!.handler).toBe(second);
  });

  it('executes a named middleware resolved from the registry', async () => {
    const calls: string[] = [];
    defineMiddleware({
      name: 'test.logger',
      priority: 10,
      handler: async (_req, next) => {
        calls.push('before');
        const res = await next();
        calls.push('after');
        return res;
      },
    });

    const def = getMiddleware('test.logger')!;
    const pipeline = composeMiddleware([def.handler]);
    await pipeline(new Request('https://example.test'), async () => {
      calls.push('handler');
      return new Response('ok');
    });

    expect(calls).toEqual(['before', 'handler', 'after']);
  });
});
