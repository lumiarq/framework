import { describe, it, expect, vi } from 'vitest';
import { withTestContext } from '../src/with-test-context.js';
import { StubCache } from '../src/stubs/stub-cache.js';
import { StubMailer } from '../src/stubs/stub-mailer.js';
import { RequestLogger } from '../src/stubs/request-logger.js';

// ── withTestContext ───────────────────────────────────────────────────────────

describe('withTestContext()', () => {
  it('runs the test function and returns its result', async () => {
    const result = await withTestContext({}, async () => 42)();
    expect(result).toBe(42);
  });

  it('propagates errors thrown inside the test function', async () => {
    const run = withTestContext({}, async () => {
      throw new Error('boom');
    });
    await expect(run()).rejects.toThrow('boom');
  });

  it('auto-rollbacks when db is provided', async () => {
    let rolled = false;

    const transactionSpy = vi.fn(async <T>(fn: (trx: unknown) => Promise<T>) => {
      try {
        return await fn({ mock: true });
      } catch {
        rolled = true;
        return undefined as T;
      }
    });

    const mockDb = {
      transaction: transactionSpy as unknown as <T>(fn: (trx: unknown) => Promise<T>) => Promise<T>,
    };

    let trxReceived: unknown;
    await withTestContext({ db: { default: mockDb } }, async () => {
      trxReceived = true;
    })();

    expect(rolled).toBe(true);
    expect(trxReceived).toBe(true);
    expect(transactionSpy).toHaveBeenCalledOnce();
  });
});

// ── StubCache ─────────────────────────────────────────────────────────────────

describe('StubCache', () => {
  it('get() returns null initially', async () => {
    const cache = new StubCache();
    expect(await cache.get('missing')).toBeNull();
  });

  it('set() + get() round-trips a value', async () => {
    const cache = new StubCache();
    await cache.set('key', { name: 'test' });
    expect(await cache.get('key')).toEqual({ name: 'test' });
  });

  it('forget() removes a key', async () => {
    const cache = new StubCache();
    await cache.set('key', 'value');
    await cache.forget('key');
    expect(await cache.get('key')).toBeNull();
  });

  it('remember() stores and returns the computed value', async () => {
    const cache = new StubCache();
    const factory = vi.fn(async () => 'computed');

    const first = await cache.remember('key', 60, factory);
    const second = await cache.remember('key', 60, factory);

    expect(first).toBe('computed');
    expect(second).toBe('computed');
    expect(factory).toHaveBeenCalledOnce(); // factory called only once
  });
});

// ── StubMailer ────────────────────────────────────────────────────────────────

describe('StubMailer', () => {
  it('records sent messages', async () => {
    const logger = new RequestLogger();
    const mailer = new StubMailer({ logger });

    const msg = {
      to: 'user@example.com',
      subject: 'Hello',
      template: 'welcome',
      payload: { name: 'Alice' },
    };

    await mailer.send(msg);
    await mailer.queue(msg);

    expect(mailer.sent).toHaveLength(2);
    expect(mailer.sent[0]).toEqual(msg);
    expect(mailer.sent[1]).toEqual(msg);
  });
});
