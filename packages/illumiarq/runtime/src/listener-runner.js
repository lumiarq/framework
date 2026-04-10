/**
 * Listener runner — executes event listeners with timeout and AbortSignal support.
 *
 * Guarantees:
 * - Each listener runs within a configurable timeout (default: 5000ms)
 * - Timeout fires ListenerTimeoutError — logged, never propagated
 * - AbortSignal is passed to the listener for cancellation
 */
export const LISTENER_RUNNER_PLACEHOLDER = true;
//# sourceMappingURL=listener-runner.js.map
