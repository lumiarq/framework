import type { PolicyDefinition } from './define-policy.js';

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

/** A Gate bound to a specific user and policy. */
export interface BoundGate {
  /**
   * Returns true if the user has the given ability, false otherwise.
   * Never throws.
   */
  allows(ability: string, resource?: unknown): Promise<boolean>;
  /**
   * Returns true if the user lacks the given ability, false otherwise.
   * Never throws.
   */
  denies(ability: string, resource?: unknown): Promise<boolean>;
  /**
   * Asserts the user has the given ability.
   *
   * @throws {AuthorizationError} if the user lacks the ability — always "Unauthorized"
   */
  authorize(ability: string, resource?: unknown): Promise<void>;
}

// Module-level named-policy registry (populated in bootstrap/policies.ts)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _policyRegistry = new Map<string, PolicyDefinition<any, any>>();

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
  register<TUser, TResource>(name: string, policy: PolicyDefinition<TUser, TResource>): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _policyRegistry.set(name, policy as PolicyDefinition<any, any>);
  },

  /**
   * Resolves a previously registered named policy.
   * Returns undefined if the name was never registered.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve(name: string): PolicyDefinition<any, any> | undefined {
    return _policyRegistry.get(name);
  },

  /**
   * Binds a user and policy to a gate instance.
   *
   * @param user   - The authenticated user object
   * @param policy - The policy definition to check against
   * @returns A BoundGate for the user
   */
  for<TUser, TResource>(user: TUser, policy: PolicyDefinition<TUser, TResource>): BoundGate {
    return new BoundGateImpl(
      user as unknown,
      policy as unknown as PolicyDefinition<unknown, unknown>,
    );
  },
};

class BoundGateImpl implements BoundGate {
  constructor(
    private readonly user: unknown,
    private readonly policy: PolicyDefinition<unknown, unknown>,
  ) {}

  async allows(ability: string, resource?: unknown): Promise<boolean> {
    const fn = this.policy.abilities[ability];
    if (!fn) return false;
    return Boolean(await fn(this.user, resource));
  }

  async denies(ability: string, resource?: unknown): Promise<boolean> {
    return !(await this.allows(ability, resource));
  }

  async authorize(ability: string, resource?: unknown): Promise<void> {
    if (await this.denies(ability, resource)) {
      throw new AuthorizationError();
    }
  }
}
