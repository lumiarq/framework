/**
 * Defines an authorization policy — an ability map checked via Gate inside Actions.
 * Policies MUST: contain only ability definitions.
 * Policies MUST NOT: query the database, emit events, or perform side effects.
 * Policies receive only the types required for authorization (ISP).
 *
 * @param abilities - Map of ability names to predicate functions
 * @returns A PolicyDefinition used with Gate.for()
 *
 * @example
 * export const userPolicy = definePolicy({
 *   update: (user: AuthUser, target: User) => user.id === target.id,
 *   delete: (user: AuthUser, target: User) => user.role === 'admin',
 * });
 */
export function definePolicy(abilities) {
  return { abilities };
}
//# sourceMappingURL=define-policy.js.map
