/**
 * Defines a Query — a read-only domain operation.
 *
 * Queries MUST:
 * - Return data without modifying state
 * - Call Repositories directly (their sole job is data retrieval)
 * - Be called from Loaders, Handlers, and Actions
 *
 * Queries MUST NOT:
 * - Emit events
 * - Perform writes of any kind
 * - Call Actions or Tasks
 * - Call Repositories outside their own module
 *
 * @param fn - Async function that reads and returns data
 * @returns The same function, preserving its full type signature
 *
 * @example
 * export const GetUserQuery = defineQuery(async (userId: string) => {
 *   const user = await UserRepository.findById(userId)
 *   if (!user) throw new NotFoundError(`User ${userId} not found.`)
 *   return user
 * })
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineQuery(fn) {
  return fn;
}
//# sourceMappingURL=define-query.js.map
