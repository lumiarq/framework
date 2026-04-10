import { describe, it, expect, afterEach, vi } from 'vitest';
import { z } from 'zod';
import { EventBus } from '../src/event/event-bus.js';
import { defineEvent } from '../src/event/define-event.js';
// clearListeners() MUST be called in afterEach.
afterEach(() => {
  EventBus.clearListeners();
});
// Event schemas contain ONLY domain fields — no idempotencyKey.
// The EventBus derives idempotencyKey = SHA-256(eventName + stableStringify(payload))
const testEvent = defineEvent({
  name: 'test-happened',
  schema: z.object({
    id: z.string(),
  }),
});
describe('EventBus.emit (v1 synchronous)', () => {
  it('dispatches payload to registered listeners in registration order', () => {
    const order = [];
    EventBus.listen(testEvent, () => {
      order.push(1);
    });
    EventBus.listen(testEvent, () => {
      order.push(2);
    });
    EventBus.emit(testEvent, { id: 'abc' });
    expect(order).toEqual([1, 2]);
  });
  it('validates payload against Zod schema before dispatch', () => {
    EventBus.listen(testEvent, () => {});
    expect(() =>
      // @ts-expect-error — intentional invalid payload (id must be string)
      EventBus.emit(testEvent, { id: 123 }),
    ).toThrow();
  });
  it('does not propagate listener errors to the emitter', () => {
    EventBus.listen(testEvent, () => {
      throw new Error('listener error');
    });
    expect(() => EventBus.emit(testEvent, { id: 'abc' })).not.toThrow();
  });
  it('still calls subsequent listeners after one throws', () => {
    const called = vi.fn();
    EventBus.listen(testEvent, () => {
      throw new Error('first fails');
    });
    EventBus.listen(testEvent, called);
    EventBus.emit(testEvent, { id: 'abc' });
    expect(called).toHaveBeenCalledOnce();
  });
  it('passes EventEnvelope as second argument to listeners', () => {
    let received = null;
    EventBus.listen(testEvent, (_payload, envelope) => {
      received = envelope;
    });
    EventBus.emit(testEvent, { id: 'abc' });
    expect(received).not.toBeNull();
    expect(received.name).toBe('test-happened');
    expect(received.payload).toEqual({ id: 'abc' });
    expect(received.emittedAt).toBeInstanceOf(Date);
    expect(received.signal).toBeInstanceOf(AbortSignal);
  });
  it('derives idempotencyKey as SHA-256 hex (64 chars) from eventName + payload', () => {
    let key;
    EventBus.listen(testEvent, (_payload, envelope) => {
      key = envelope.idempotencyKey;
    });
    EventBus.emit(testEvent, { id: 'abc' });
    expect(key).toBeDefined();
    // SHA-256 digest in hex = 64 characters (0-9, a-f)
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
  it('produces the same idempotencyKey for identical payloads (stable)', () => {
    const keys = [];
    EventBus.listen(testEvent, (_p, env) => {
      keys.push(env.idempotencyKey);
    });
    EventBus.emit(testEvent, { id: 'same' });
    EventBus.emit(testEvent, { id: 'same' });
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
  });
  it('produces distinct idempotencyKeys for different payloads', () => {
    const keys = [];
    EventBus.listen(testEvent, (_p, env) => {
      keys.push(env.idempotencyKey);
    });
    EventBus.emit(testEvent, { id: 'first' });
    EventBus.emit(testEvent, { id: 'second' });
    expect(keys).toHaveLength(2);
    expect(keys[0]).not.toBe(keys[1]);
  });
});
describe('EventBus.dispatch (v1.5 fire-and-forget)', () => {
  it('returns before listeners complete (non-blocking)', async () => {
    const completed = [];
    EventBus.listen(testEvent, async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      completed.push(true);
    });
    const start = Date.now();
    EventBus.dispatch(testEvent, { id: 'abc' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(30);
    expect(completed).toHaveLength(0);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(completed).toHaveLength(1);
  });
  it('validates payload synchronously before async dispatch', () => {
    EventBus.listen(testEvent, async () => {});
    expect(() =>
      // @ts-expect-error — intentional invalid payload
      EventBus.dispatch(testEvent, { id: 999 }),
    ).toThrow();
  });
  it('passes EventEnvelope to async listeners with stable idempotencyKey', async () => {
    let received = null;
    EventBus.listen(testEvent, async (_payload, envelope) => {
      received = envelope;
    });
    EventBus.dispatch(testEvent, { id: 'abc' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(received).not.toBeNull();
    // SHA-256 hex = 64 characters
    expect(received.idempotencyKey).toMatch(/^[0-9a-f]{64}$/);
  });
});
describe('EventBus upgrade path', () => {
  it('clearListeners removes all registered listeners', () => {
    const called = vi.fn();
    EventBus.listen(testEvent, called);
    EventBus.clearListeners();
    EventBus.emit(testEvent, { id: 'abc' });
    expect(called).not.toHaveBeenCalled();
  });
});
// ─── Listener timeout + AbortSignal ──────────────────────────────────────────
describe('EventBus — listener timeout', () => {
  it('times out a slow listener and does NOT propagate the error to emitter', async () => {
    // Use a very short timeout for test speed
    EventBus.listen(
      testEvent,
      async () => new Promise((res) => setTimeout(res, 200)), // 200ms listener
      { timeout: 50 },
    );
    // dispatch must return before listener completes (fire-and-forget)
    EventBus.dispatch(testEvent, { id: 'slow' });
    // Give the timer enough time to fire and clean up
    await new Promise((res) => setTimeout(res, 120));
    // No unhandled rejection — test passes if we got here
  });
  it('envelope.signal is aborted when listener times out', async () => {
    let receivedSignal = null;
    EventBus.listen(
      testEvent,
      async (_payload, envelope) => {
        receivedSignal = envelope.signal;
        // Simulate a long-running operation that respects abort
        await new Promise((res) => setTimeout(res, 200));
      },
      { timeout: 50 },
    );
    EventBus.dispatch(testEvent, { id: 'abort-test' });
    // Wait for timeout to fire (50ms) + some buffer
    await new Promise((res) => setTimeout(res, 100));
    expect(receivedSignal).not.toBeNull();
    expect(receivedSignal.aborted).toBe(true);
  });
  it('envelope.signal is available in sync emit listeners (never aborted)', () => {
    let receivedSignal = null;
    EventBus.listen(testEvent, (_payload, envelope) => {
      receivedSignal = envelope.signal;
    });
    EventBus.emit(testEvent, { id: 'sync-signal' });
    expect(receivedSignal).not.toBeNull();
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    // Sync emit's signal is never aborted
    expect(receivedSignal.aborted).toBe(false);
  });
  it('per-listener timeout is configurable — fast listener completes within its window', async () => {
    const completed = [];
    // 50ms listener with a generous 300ms timeout — should complete successfully
    EventBus.listen(
      testEvent,
      async () => {
        await new Promise((res) => setTimeout(res, 50));
        completed.push(true);
      },
      { timeout: 300 },
    );
    EventBus.dispatch(testEvent, { id: 'generous-timeout' });
    await new Promise((res) => setTimeout(res, 150));
    expect(completed).toHaveLength(1);
  });
});
//# sourceMappingURL=event-bus.test.js.map
