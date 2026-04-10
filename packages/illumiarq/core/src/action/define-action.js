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
export function defineAction(fn, _metadata) {
  return fn;
}
//# sourceMappingURL=define-action.js.map
