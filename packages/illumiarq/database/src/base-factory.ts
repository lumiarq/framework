/**
 * Abstract base class for model factories used in tests.
 * Factories produce in-memory domain objects — no database writes.
 *
 * @template TModel - The model type produced by this factory
 * @example
 * class UserFactory extends BaseFactory<User> {
 *   make(overrides?: Partial<User>): User {
 *     return { id: crypto.randomUUID(), email: 'test@example.com', ...overrides };
 *   }
 * }
 */
export abstract class BaseFactory<TModel> {
  /** Produce a single model instance. */
  abstract make(overrides?: Partial<TModel>): TModel;

  /**
   * Produce multiple model instances.
   * @param count - Number of instances to produce
   * @param overrides - Overrides applied to every instance
   */
  makeMany(count: number, overrides?: Partial<TModel>): TModel[] {
    return Array.from({ length: count }, () => this.make(overrides));
  }
}
