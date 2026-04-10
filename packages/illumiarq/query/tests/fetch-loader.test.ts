import { describe, it, expect } from 'vitest';
import { fetchLoader } from '../src/core/index.js';
import {
  createLoaderQuery,
  toTanStackOptions,
  createLoaderQueryOptions,
} from '../src/react/index.js';
import { defineLoader } from '@illumiarq/http';
import { z } from 'zod';

const echoLoader = defineLoader({
  id: 'echo',
  schema: z.object({ id: z.string() }),
  async fetch({ input }) {
    return { result: input.id };
  },
});

// ─── fetchLoader (core — framework-agnostic) ──────────────────────────────────

describe('fetchLoader', () => {
  it('wraps a BoundLoader into a thunk', async () => {
    const fn = fetchLoader(echoLoader, { id: 'test-123' });
    const result = await fn();
    expect(result).toEqual({ result: 'test-123' });
  });

  it('passes input through to loader.fetch', async () => {
    const fn = fetchLoader(echoLoader, { id: 'hello-world' });
    const result = await fn();
    expect((result as { result: string }).result).toBe('hello-world');
  });
});

// ─── createLoaderQuery (react adapter — TanStack Query naming) ────────────────

describe('createLoaderQuery', () => {
  it('returns queryKey and queryFn in TanStack Query naming convention', async () => {
    const query = createLoaderQuery(['echo', 'test-456'], echoLoader, { id: 'test-456' });
    expect(query.queryKey).toEqual(['echo', 'test-456']);
    const result = await query.queryFn();
    expect(result).toEqual({ result: 'test-456' });
  });

  it('queryFn is a thunk (not executed on creation)', () => {
    let called = false;
    const lazyLoader = defineLoader({
      id: 'lazy',
      schema: z.object({ x: z.number() }),
      async fetch() {
        called = true;
        return {};
      },
    });
    createLoaderQuery(['lazy'], lazyLoader, { x: 1 });
    expect(called).toBe(false);
  });
});

// ─── toTanStackOptions (react adapter maps core → TanStack) ──────────────────

describe('toTanStackOptions', () => {
  it('maps key → queryKey and fetcher → queryFn', () => {
    const coreOpts = createLoaderQueryOptions(['p', '1'], echoLoader, { id: '1' }, 0);
    const tanOpts = toTanStackOptions(coreOpts);
    expect(tanOpts.queryKey).toEqual(['p', '1']);
    expect(typeof tanOpts.queryFn).toBe('function');
    expect(tanOpts.staleTime).toBe(0);
  });

  it('the mapped queryFn executes the loader', async () => {
    const coreOpts = createLoaderQueryOptions(['echo', 'z'], echoLoader, { id: 'z' }, 0);
    const tanOpts = toTanStackOptions(coreOpts);
    const result = await tanOpts.queryFn();
    expect(result).toEqual({ result: 'z' });
  });
});
