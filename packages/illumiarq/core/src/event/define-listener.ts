import type { ZodTypeAny, z } from 'zod';
import type { EventDefinition } from './define-event.js';

/**
 * A typed listener definition produced by `defineListener`.
 * Used by `boot()` for automatic listener registration from module event files.
 *
 * @template S - The Zod schema type of the associated event
 */
export interface ListenerDefinition<S extends ZodTypeAny = ZodTypeAny> {
  /** The event this listener subscribes to. */
  event: EventDefinition<S>;
  /** The async handler invoked when the event is dispatched. */
  handler: (payload: z.infer<S>) => Promise<void>;
}

/**
 * Defines a typed event listener for automatic registration by `boot()`.
 *
 * Listener files export named `ListenerDefinition` values. During boot,
 * `discoverModules()` imports each listener file and calls `EventBus.listen()`
 * for every export that satisfies the `ListenerDefinition` shape.
 *
 * Unlike wiring listeners manually in `bootstrap/events.ts`, `defineListener`
 * allows each module to declare its own listeners co-located with its events.
 * The framework auto-loads them — no central registration file is needed.
 *
 * @param event   - The event definition (produced by `defineEvent`)
 * @param handler - Async function invoked for each matching dispatch
 * @returns A `ListenerDefinition` that boot() can auto-register
 *
 * @example
 * // modules/Auth/events/listeners/on-user-registered.ts
 * export const onUserRegistered = defineListener(
 *   UserRegistered,
 *   async (payload) => {
 *     await CreateUserProfileAction({ identityId: payload.identityId });
 *   },
 * );
 */
export function defineListener<S extends ZodTypeAny>(
  event: EventDefinition<S>,
  handler: (payload: z.infer<S>) => Promise<void>,
): ListenerDefinition<S> {
  return { event, handler };
}
