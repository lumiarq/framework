/**
 * The function signature every query must conform to.
 * Queries are read-only domain operations — no writes, no event emissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryFn<TInput, TOutput> = (input: TInput) => Promise<TOutput>;

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
export function defineQuery<TFn extends (input: any) => Promise<any>>(fn: TFn): TFn {
  return fn;
}
