/**
 * Abstract base class for model factories.
 * Extend to provide test data generation backed by @faker-js/faker.
 *
 * @template T - The model type this factory produces
 *
 * @example
 * export class UserFactory extends BaseFactory<User> {
 *   make(overrides?: Partial<User>): User {
 *     return UserSchema.parse({
 *       id:    crypto.randomUUID(),
 *       email: faker.internet.email(),
 *       name:  faker.person.fullName(),
 *       ...overrides,
 *     })
 *   }
 * }
 */
export abstract class BaseFactory<T> {
  /** Produce a single model instance, optionally overriding fields. */
  abstract make(overrides?: Partial<T>): T;

  /**
   * Produce multiple model instances.
   *
   * @param count     - Number of instances to produce
   * @param overrides - Fields to override on every instance
   */
  makeMany(count: number, overrides?: Partial<T>): T[] {
    return Array.from({ length: count }, () => this.make(overrides));
  }
}
