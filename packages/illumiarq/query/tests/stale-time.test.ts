import { describe, it, expect } from 'vitest';
import { loaderStaleTime, createLoaderQueryOptions } from '../src/core/index.js';
import { defineLoader } from '@illumiarq/http';
import { z } from 'zod';

const echoLoader = defineLoader({
  id: 'echo',
  schema: z.object({ id: z.string() }),
  async fetch({ input }) {
    return { result: input.id };
  },
});

// ─── loaderStaleTime ─────────────────────────────────────────────────────────

describe('loaderStaleTime — staleTime encoding per strategy', () => {
  it('returns 0 for dynamic routes (always stale)', () => {
    expect(loaderStaleTime(0)).toBe(0);
  });

  it('returns Infinity for SSG routes (never stale)', () => {
    expect(loaderStaleTime(Infinity)).toBe(Infinity);
  });

  it('returns the derived staleTime for ISR routes (N * 500ms)', () => {
    expect(loaderStaleTime(43200000)).toBe(43200000);
  });

  it('returns the exact value for small ISR revalidate periods', () => {
    expect(loaderStaleTime(30000)).toBe(30000);
  });

  it('passes through arbitrary numeric values unchanged', () => {
    expect(loaderStaleTime(12345)).toBe(12345);
  });
});

// ─── createLoaderQueryOptions (core / framework-agnostic) ────────────────────

describe('createLoaderQueryOptions — framework-agnostic', () => {
  it('returns an object with key, fetcher, and staleTime — NOT queryKey/queryFn', () => {
    const opts = createLoaderQueryOptions(['echo', '1'], echoLoader, { id: '1' }, 0);
    expect(opts).toHaveProperty('key');
    expect(opts).toHaveProperty('fetcher');
    expect(opts).toHaveProperty('staleTime');
    expect(opts).not.toHaveProperty('queryKey');
    expect(opts).not.toHaveProperty('queryFn');
  });

  it('key matches the provided key array', () => {
    const key = ['echo', 'abc'];
    const opts = createLoaderQueryOptions(key, echoLoader, { id: 'abc' }, 0);
    expect(opts.key).toEqual(key);
  });

  it('fetcher executes the loader and returns the result', async () => {
    const opts = createLoaderQueryOptions(['echo', 'xyz'], echoLoader, { id: 'xyz' }, 0);
    const result = await opts.fetcher();
    expect(result).toEqual({ result: 'xyz' });
  });

  it('fetcher is a thunk — not executed at construction time', () => {
    let called = false;
    const lazyLoader = defineLoader({
      id: 'lazy',
      schema: z.object({ v: z.number() }),
      async fetch() {
        called = true;
        return {};
      },
    });

    createLoaderQueryOptions(['lazy'], lazyLoader, { v: 1 }, 0);

    expect(called).toBe(false);
  });

  it('sets staleTime to 0 for dynamic routes', () => {
    const opts = createLoaderQueryOptions(['echo', '1'], echoLoader, { id: '1' }, 0);
    expect(opts.staleTime).toBe(0);
  });

  it('sets staleTime to Infinity for SSG routes', () => {
    const opts = createLoaderQueryOptions(['echo', '1'], echoLoader, { id: '1' }, Infinity);
    expect(opts.staleTime).toBe(Infinity);
  });

  it('sets staleTime to ISR-derived value for ISR routes', () => {
    const opts = createLoaderQueryOptions(['echo', '1'], echoLoader, { id: '1' }, 43200000);
    expect(opts.staleTime).toBe(43200000);
  });
});
