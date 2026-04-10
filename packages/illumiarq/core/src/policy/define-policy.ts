/**
 * An ability map: keys are ability names, values are functions that return boolean.
 * The generics are intentionally flexible — each policy defines only the types it needs (ISP).
 */
export type AbilityMap<TUser, TResource = void> = Record<
  string,
  (user: TUser, resource?: TResource) => boolean | Promise<boolean>
>;

/** A policy definition produced by definePolicy. */
export interface PolicyDefinition<TUser, TResource = void> {
  abilities: AbilityMap<TUser, TResource>;
}

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
export function definePolicy<TUser, TResource = void>(
  abilities: AbilityMap<TUser, TResource>,
): PolicyDefinition<TUser, TResource> {
  return { abilities };
}
