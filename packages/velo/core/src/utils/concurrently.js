/**
 * Named wrapper for Promise.all — idiomatic LumiARQ concurrency primitive.
 *
 * @example
 * const [user, posts] = await concurrently(fetchUser(id), fetchPosts(id));
 */
export function concurrently(...promises) {
  return Promise.all(promises);
}
//# sourceMappingURL=concurrently.js.map
