import { createHash } from 'node:crypto';
import { ListenerTimeoutError } from '../errors/listener-timeout-error.js';
/** Default listener timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 5_000;
/** Deterministic JSON serialisation with sorted object keys. */
function stableStringify(value) {
  if (value === null || value === undefined || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}
/** Derives a stable idempotency key: SHA-256(eventName + stableStringify(payload)). */
function deriveKey(eventName, payload) {
  return createHash('sha256')
    .update(eventName + stableStringify(payload))
    .digest('hex');
}
/**
 * Wraps a single listener in a per-listener AbortController + timeout race.
 * Builds the complete envelope (including `signal`) right before execution.
 */
async function runListenerWithTimeout(entry, base) {
  const controller = new AbortController();
  const envelope = { ...base, signal: controller.signal };
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error(`[EventBus] ${new ListenerTimeoutError(base.name, entry.timeoutMs).message}`);
  }, entry.timeoutMs);
  try {
    await Promise.race([
      Promise.resolve(entry.fn(base.payload, envelope)),
      new Promise((_, reject) =>
        controller.signal.addEventListener('abort', () =>
          reject(new ListenerTimeoutError(base.name, entry.timeoutMs)),
        ),
      ),
    ]);
  } catch (err) {
    if (!(err instanceof ListenerTimeoutError)) {
      console.error(`[EventBus] Listener error for "${base.name}":`, err);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
// ─── EventBus ─────────────────────────────────────────────────────────────────
/**
 * The LumiARQ EventBus — synchronous in-process dispatch (v1) +
 * async fire-and-forget with per-listener timeouts (v1.5).
 *
 * Design constraints:
 * - Listener errors NEVER propagate to the emitting Action.
 * - Payloads are validated by Zod before ANY listener is called.
 * - All EventBus.listen() calls must be in bootstrap/events.ts.
 * - clearListeners() must be called in afterEach in all event tests.
 * - idempotencyKey lives in the EventEnvelope, not the domain schema.
 * - idempotencyKey = SHA-256(eventName + stableStringify(payload)) — deterministic.
 * - Listener timeout defaults to 5000ms; ListenerTimeoutError logged, not propagated.
 */
class EventBusImpl {
  listeners = new Map();
  /**
   * Registers a listener for an event.
   * ALL calls to listen() must be in bootstrap/events.ts.
   *
   * @param event   - The event definition to listen for
   * @param fn      - Listener function receiving the validated payload + envelope
   * @param options - Per-listener options
   * @param options.timeout - Listener timeout in milliseconds (default: 5000ms)
   */
  listen(event, fn, options) {
    const entries = this.listeners.get(event.name) ?? [];
    entries.push({
      fn: fn,
      timeoutMs: options?.timeout ?? DEFAULT_TIMEOUT_MS,
    });
    this.listeners.set(event.name, entries);
  }
  /**
   * Emits an event synchronously (v1).
   * All listeners run to completion before returning.
   * Listener errors are caught and logged — they NEVER propagate.
   *
   * @throws {ZodError} if payload fails schema validation
   */
  emit(event, payload) {
    const validated = event.validate(payload);
    const envelope = {
      idempotencyKey: deriveKey(event.name, validated),
      name: event.name,
      emittedAt: new Date(),
      payload: validated,
      signal: new AbortController().signal, // never aborted in sync emit
    };
    const entries = this.listeners.get(event.name) ?? [];
    for (const entry of entries) {
      try {
        const result = entry.fn(validated, envelope);
        if (result instanceof Promise) {
          result.catch((err) =>
            console.error(`[EventBus] Listener error for "${event.name}":`, err),
          );
        }
      } catch (err) {
        console.error(`[EventBus] Listener error for "${event.name}":`, err);
      }
    }
  }
  /**
   * Dispatches an event asynchronously (v1.5 — fire-and-forget).
   * Returns immediately; all listeners run concurrently in the background.
   * Each listener runs inside its own AbortController + timeout race (default: 5000ms).
   * Timed-out listeners log `ListenerTimeoutError` and are aborted via `envelope.signal`.
   *
   * @throws {ZodError} if payload fails schema validation (synchronous, before async)
   */
  dispatch(event, payload) {
    const validated = event.validate(payload);
    const base = {
      idempotencyKey: deriveKey(event.name, validated),
      name: event.name,
      emittedAt: new Date(),
      payload: validated,
    };
    const entries = this.listeners.get(event.name) ?? [];
    Promise.allSettled(entries.map((entry) => runListenerWithTimeout(entry, base))).catch(() => {
      // allSettled never rejects — defensive catch for safety
    });
  }
  /**
   * Removes all registered listeners.
   * MUST be called in afterEach in all event tests to prevent test pollution.
   */
  clearListeners() {
    this.listeners.clear();
  }
}
/** Singleton EventBus instance for the application. */
export const EventBus = new EventBusImpl();
//# sourceMappingURL=event-bus.js.map
