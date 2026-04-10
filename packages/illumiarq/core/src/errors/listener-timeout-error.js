import { LumiARQError } from './lumiarq-error.js';
/**
 * Logged when a listener exceeds its allowed execution time.
 * NEVER propagated to the emitting Action — logged only.
 *
 * The AbortSignal passed to the listener will have `aborted: true` when this fires.
 * Listeners should check `signal.aborted` to bail out of long-running operations.
 *
 * Default timeout is 5000ms. Configurable per-listener via
 * `EventBus.listen(event, handler, { timeout: 10_000 })`.
 */
export class ListenerTimeoutError extends LumiARQError {
  name = 'ListenerTimeoutError';
  /**
   * @param eventName  - The name of the event whose listener timed out
   * @param timeoutMs  - The timeout duration that was exceeded
   */
  constructor(eventName, timeoutMs) {
    super(`Listener for "${eventName}" exceeded ${timeoutMs}ms timeout`);
  }
}
//# sourceMappingURL=listener-timeout-error.js.map
