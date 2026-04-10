import { createHash } from 'node:crypto';
import type { EventDefinition } from './define-event.js';
import { type ZodTypeAny, z } from 'zod';
import { ListenerTimeoutError } from '../errors/listener-timeout-error.js';

/** Default listener timeout in milliseconds. */
const DEFAULT_TIMEOUT_MS = 5_000;

// ─── Envelope ─────────────────────────────────────────────────────────────────

/**
 * Framework-managed wrapper around every emitted event payload.
 * Passed as the second argument to every listener.
 *
 * `idempotencyKey` is derived deterministically:
 *   SHA-256(eventName + stableStringify(payload))
 *
 * The same logical emission always produces the same key — safe to use as
 * a deduplication store key inside listener bodies.
 *
 * `signal` is aborted by the per-listener timeout in `dispatch`.
 * In synchronous `emit`, the signal is never aborted.
 */
export interface EventEnvelope<T = unknown> {
  /** SHA-256(eventName + stableStringify(payload)) — stable and deterministic */
  idempotencyKey: string;
  /** Event name from defineEvent (e.g. 'auth.user-registered') */
  name: string;
  /** Timestamp captured at the moment of emission */
  emittedAt: Date;
  /** The validated domain payload */
  payload: T;
  /** AbortSignal — aborted when the listener exceeds its configured timeout */
  signal: AbortSignal;
}

// ─── Listener ─────────────────────────────────────────────────────────────────

/**
 * A listener function registered for a specific event.
 * - `payload`  — the validated domain payload (typed by the event schema)
 * - `envelope` — framework envelope with idempotencyKey, name, emittedAt, signal
 *
 * The envelope's `idempotencyKey` is stable for the same logical payload,
 * making it suitable as a deduplication key in external stores.
 */
export type ListenerFn<S extends ZodTypeAny> = (
  payload: z.infer<S>,
  envelope: EventEnvelope<z.infer<S>>,
) => void | Promise<void>;

// ─── Internal ─────────────────────────────────────────────────────────────────

interface ListenerEntry {
  fn: ListenerFn<ZodTypeAny>;
  timeoutMs: number;
}

/** Deterministic JSON serialisation with sorted object keys. */
function stableStringify(value: unknown): string {
  if (value === null || value === undefined || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`).join(',')}}`;
}

/** Derives a stable idempotency key: SHA-256(eventName + stableStringify(payload)). */
function deriveKey(eventName: string, payload: unknown): string {
  return createHash('sha256')
    .update(eventName + stableStringify(payload))
    .digest('hex');
}

/**
 * Wraps a single listener in a per-listener AbortController + timeout race.
 * Builds the complete envelope (including `signal`) right before execution.
 */
async function runListenerWithTimeout(
  entry: ListenerEntry,
  base: Omit<EventEnvelope, 'signal'>,
): Promise<void> {
  const controller = new AbortController();
  const envelope = { ...base, signal: controller.signal };

  const timeoutId = setTimeout(() => {
    controller.abort();
    console.error(`[EventBus] ${new ListenerTimeoutError(base.name, entry.timeoutMs).message}`);
  }, entry.timeoutMs);

  try {
    await Promise.race([
      Promise.resolve(
        entry.fn(
          base.payload as z.infer<ZodTypeAny>,
          envelope as EventEnvelope<z.infer<ZodTypeAny>>,
        ),
      ),
      new Promise<never>((_, reject) =>
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
  private listeners = new Map<string, ListenerEntry[]>();

  /**
   * Registers a listener for an event.
   * ALL calls to listen() must be in bootstrap/events.ts.
   *
   * @param event   - The event definition to listen for
   * @param fn      - Listener function receiving the validated payload + envelope
   * @param options - Per-listener options
   * @param options.timeout - Listener timeout in milliseconds (default: 5000ms)
   */
  listen<S extends ZodTypeAny>(
    event: EventDefinition<S>,
    fn: ListenerFn<S>,
    options?: { timeout?: number },
  ): void {
    const entries = this.listeners.get(event.name) ?? [];
    entries.push({
      fn: fn as ListenerFn<ZodTypeAny>,
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
  emit<S extends ZodTypeAny>(event: EventDefinition<S>, payload: z.infer<S>): void {
    const validated = event.validate(payload);
    const envelope: EventEnvelope = {
      idempotencyKey: deriveKey(event.name, validated),
      name: event.name,
      emittedAt: new Date(),
      payload: validated,
      signal: new AbortController().signal, // never aborted in sync emit
    };
    const entries = this.listeners.get(event.name) ?? [];

    for (const entry of entries) {
      try {
        const result = entry.fn(validated, envelope as EventEnvelope<z.infer<ZodTypeAny>>);
        if (result instanceof Promise) {
          result.catch((err: unknown) =>
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
  dispatch<S extends ZodTypeAny>(event: EventDefinition<S>, payload: z.infer<S>): void {
    const validated = event.validate(payload);
    const base: Omit<EventEnvelope, 'signal'> = {
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
  clearListeners(): void {
    this.listeners.clear();
  }
}

/** Singleton EventBus instance for the application. */
export const EventBus = new EventBusImpl();
