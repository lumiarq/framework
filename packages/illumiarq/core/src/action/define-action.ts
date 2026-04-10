/**
 * The function signature every action must conform to.
 * TDeps allows injecting repositories/services as additional arguments.
 */
export type ActionFn<TInput, TOutput, TDeps extends unknown[] = []> = (
  input: TInput,
  ...deps: TDeps
) => Promise<TOutput>;

/**
 * Optional metadata declared on an Action.
 *
 * `idempotent` declares the action's intent — enforcement is deferred to
 * whichever store or middleware the application wires up.
 *
 * - `true`  — framework derives the key from the action name + serialised input
 * - object  — supply a custom key deriver and/or a TTL for the deduplication window
 */
export interface ActionMetadata {
  idempotent?:
    | boolean
    | {
        /** Custom key deriver. Receives the raw input and returns a string key. */
        key?: (input: unknown) => string;
        /** Deduplication window TTL (e.g. '5m', '1h'). Interpretation is store-specific. */
        ttl?: string;
      };
}

/**
 * Defines an Action — the orchestration layer between Handlers and Tasks.
 * Actions MUST: call one or more Tasks, emit events.
 * Actions MUST NOT: contain business logic, query the database directly.
 *
 * Supports optional additional dependency arguments (repositories, services) via the
 * TDeps type parameter, maintaining full TypeScript type safety.
 *
 * @param fn       - Action function (input + optional deps → Promise<output>)
 * @param metadata - Optional metadata (currently: idempotent declaration)
 * @returns The same function, preserving its full type signature
 *
 * @example
 * export const createUserAction = defineAction(
 *   async (input: CreateUserInput, repo: IUserRepository) => {
 *     const user = await createUserTask(input, repo);
 *     EventBus.emit(userCreatedEvent, { user });
 *     return user;
 *   },
 *   { idempotent: true },
 * );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineAction<TFn extends (input: any, ...deps: any[]) => Promise<any>>(
  fn: TFn,
  _metadata?: ActionMetadata,
): TFn {
  return fn;
}
