import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCacheDriver } from '../src/drivers/in-memory.js';
import { SessionCacheDriver } from '../src/drivers/session.js';

describe('InMemoryCacheDriver', () => {
  let cache: InMemoryCacheDriver;

  beforeEach(() => {
    cache = new InMemoryCacheDriver();
  });

  it('returns null on cache miss', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('set + get round-trips a value', async () => {
    await cache.set('key', 'value');
    expect(await cache.get('key')).toBe('value');
  });

  it('forget removes the key', async () => {
    await cache.set('key', 42);
    await cache.forget('key');
    expect(await cache.get('key')).toBeNull();
  });

  it('remember stores and returns computed value', async () => {
    const result = await cache.remember('key', 60, async () => 'computed');
    expect(result).toBe('computed');
    expect(await cache.get('key')).toBe('computed');
  });

  it('remember does not recompute on hit', async () => {
    await cache.set('key', 'original');
    let calls = 0;
    const result = await cache.remember('key', 60, async () => {
      calls++;
      return 'new';
    });
    expect(result).toBe('original');
    expect(calls).toBe(0);
  });

  it('flush clears all keys', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    cache.flush();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });
});

describe('SessionCacheDriver', () => {
  let session: Record<string, unknown>;
  let cache: SessionCacheDriver;

  beforeEach(() => {
    session = {};
    cache = new SessionCacheDriver(session);
  });

  it('returns null on cache miss', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('set + get round-trips a value', async () => {
    await cache.set('key', 'value');
    expect(await cache.get('key')).toBe('value');
  });

  it('forget removes the key', async () => {
    await cache.set('key', 42);
    await cache.forget('key');
    expect(await cache.get('key')).toBeNull();
  });

  it('remember stores and returns computed value', async () => {
    const result = await cache.remember('key', 60, async () => 'computed');
    expect(result).toBe('computed');
    expect(await cache.get('key')).toBe('computed');
  });

  it('remember does not recompute on hit', async () => {
    await cache.set('key', 'original');
    let calls = 0;
    const result = await cache.remember('key', 60, async () => {
      calls++;
      return 'new';
    });
    expect(result).toBe('original');
    expect(calls).toBe(0);
  });

  it('keys are prefixed in the underlying session object', async () => {
    await cache.set('mykey', 'myvalue');
    expect(session['_cache:mykey']).toBe('myvalue');
    expect(session['mykey']).toBeUndefined();
  });

  it('supports custom prefix', async () => {
    const customSession: Record<string, unknown> = {};
    const customCache = new SessionCacheDriver(customSession, 'req:');
    await customCache.set('token', 'abc');
    expect(customSession['req:token']).toBe('abc');
  });
});
