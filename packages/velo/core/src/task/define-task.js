/**
 * Defines a Task — a single unit of business logic.
 * Tasks MUST: perform one unit of work, use Repositories (via IRepository interface).
 * Tasks MUST NOT: call Tasks in a different module.
 * Tasks MUST NOT: query the database directly — only through IRepository.
 *
 * @param fn - Task function (input + optional deps → Promise<output>)
 * @returns The same function, preserving its full type signature
 *
 * @example
 * export const hashPasswordTask = defineTask(async (plain: string) => argon2.hash(plain));
 *
 * export const findUserByEmailTask = defineTask(
 *   async (email: string, repo: IUserRepository) => repo.findByEmail(email),
 * );
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineTask(fn) {
  return fn;
}
//# sourceMappingURL=define-task.js.map
