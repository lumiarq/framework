/**
 * defineBinding — creates a route model binding resolver.
 */

/** The resolver function — receives the path param value, returns the entity or null. */
export type BindingResolver<T> = (id: string) => Promise<T | null>;

/** A route model binding produced by defineBinding(). */
export interface BindingDefinition<T = unknown> {
  readonly _brand: 'BindingDefinition';
  readonly resolve: BindingResolver<T>;
}

/**
 * Defines a route model binding.
 */
export function defineBinding<T>(resolve: BindingResolver<T>): BindingDefinition<T> {
  return { _brand: 'BindingDefinition', resolve };
}
