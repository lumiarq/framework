/**
 * Re-export EventBus singleton as `eventBus` (lowercase alias).
 *
 * Used by app code to emit and listen for domain events.
 *
 * @example
 * import { eventBus } from '@lumiarq/framework';
 *
 * eventBus.emit(UserCreated, { userId: '123', email: 'user@example.com' });
 * eventBus.listen(UserCreated, async (payload) => { ... });
 */
export { EventBus as eventBus } from '@illumiarqcore';
//# sourceMappingURL=event-bus-instance.js.map
