/**
 * Thrown when Gate.authorize() determines the user lacks permission.
 * Message is always "Unauthorized" — never specific.
 */
export class AuthorizationError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'AuthorizationError';
  }
}
// Module-level named-policy registry (populated in bootstrap/policies.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _policyRegistry = new Map();
/**
 * The Gate — authorization checker used inside Actions.
 * Middleware authenticates (who are you?); Gate authorizes (what can you do?).
 *
 * @example
 * // bootstrap/policies.ts
 * Gate.register('user', UserPolicy);
 *
 * // inside an Action
 * const gate = Gate.for(currentUser, userPolicy);
 * await gate.authorize('update', targetUser);
 */
export const Gate = {
  /**
   * Registers a named policy so middleware can resolve it by name.
   * ALL Gate.register() calls must live in bootstrap/policies.ts.
   */
  register(name, policy) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _policyRegistry.set(name, policy);
  },
  /**
   * Resolves a previously registered named policy.
   * Returns undefined if the name was never registered.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve(name) {
    return _policyRegistry.get(name);
  },
  /**
   * Binds a user and policy to a gate instance.
   *
   * @param user   - The authenticated user object
   * @param policy - The policy definition to check against
   * @returns A BoundGate for the user
   */
  for(user, policy) {
    return new BoundGateImpl(user, policy);
  },
};
class BoundGateImpl {
  user;
  policy;
  constructor(user, policy) {
    this.user = user;
    this.policy = policy;
  }
  async allows(ability, resource) {
    const fn = this.policy.abilities[ability];
    if (!fn) return false;
    return Boolean(await fn(this.user, resource));
  }
  async denies(ability, resource) {
    return !(await this.allows(ability, resource));
  }
  async authorize(ability, resource) {
    if (await this.denies(ability, resource)) {
      throw new AuthorizationError();
    }
  }
}
//# sourceMappingURL=gate.js.map
