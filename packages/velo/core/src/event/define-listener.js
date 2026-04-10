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
export function defineListener(event, handler) {
  return { event, handler };
}
//# sourceMappingURL=define-listener.js.map
