/**
 * Named wrapper for Promise.all — idiomatic LumiARQ concurrency primitive.
 *
 * @example
 * const [user, posts] = await concurrently(fetchUser(id), fetchPosts(id));
 */
export function concurrently<T extends readonly unknown[]>(
  ...promises: { [K in keyof T]: Promise<T[K]> }
): Promise<T> {
  return Promise.all(promises) as Promise<T>;
}
