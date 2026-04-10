import { describe, it, expect } from 'vitest';
import * as authCore from '../src/index.js';

describe('@velo/auth boundary invariants (invariant 60)', () => {
  it('does not export any route definition', () => {
    const keys = Object.keys(authCore);
    // No export should include the word "route" or "Route"
    const routeExports = keys.filter((k) => k.toLowerCase().includes('route'));
    expect(routeExports).toHaveLength(0);
  });

  it('does not export any handler', () => {
    const keys = Object.keys(authCore);
    const handlerExports = keys.filter((k) => k.toLowerCase().includes('handler'));
    expect(handlerExports).toHaveLength(0);
  });

  it('does not export any database schema', () => {
    const keys = Object.keys(authCore);
    const schemaExports = keys.filter(
      (k) => k.toLowerCase().includes('schema') || k.toLowerCase().includes('table'),
    );
    expect(schemaExports).toHaveLength(0);
  });

  it('exports all expected contracts, tasks, actions, and validators', () => {
    // Contracts (type-only; check via actual value exports where available)
    expect(authCore).toHaveProperty('HashPasswordTask');
    expect(authCore).toHaveProperty('VerifyPasswordTask');
    expect(authCore).toHaveProperty('IssueJwtTask');
    expect(authCore).toHaveProperty('VerifyJwtTask');
    expect(authCore).toHaveProperty('CreateSessionTask');
    expect(authCore).toHaveProperty('RevokeSessionTask');
    expect(authCore).toHaveProperty('BaseLoginAction');
    expect(authCore).toHaveProperty('BaseRegisterAction');
    expect(authCore).toHaveProperty('BaseLogoutAction');
    expect(authCore).toHaveProperty('BaseForgotPasswordAction');
    expect(authCore).toHaveProperty('BaseResetPasswordAction');
    expect(authCore).toHaveProperty('BaseLoginValidator');
    expect(authCore).toHaveProperty('BaseRegisterValidator');
  });
});
