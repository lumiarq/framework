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
export class BaseFactory {
  /**
   * Produce multiple model instances.
   * @param count - Number of instances to produce
   * @param overrides - Overrides applied to every instance
   */
  makeMany(count, overrides) {
    return Array.from({ length: count }, () => this.make(overrides));
  }
}
//# sourceMappingURL=base-factory.js.map
