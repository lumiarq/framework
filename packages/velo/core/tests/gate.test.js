import { describe, it, expect } from 'vitest';
import { Gate, AuthorizationError } from '../src/policy/gate.js';
import { definePolicy } from '../src/policy/define-policy.js';
const testPolicy = definePolicy({
  update: (user, resource) => user.id === resource?.ownerId,
  delete: (user) => user.role === 'admin',
});
describe('Gate', () => {
  const owner = { id: 'user-1', role: 'member' };
  const admin = { id: 'user-2', role: 'admin' };
  const resource = { ownerId: 'user-1' };
  it('allows when ability predicate returns true', async () => {
    const gate = Gate.for(owner, testPolicy);
    expect(await gate.allows('update', resource)).toBe(true);
  });
  it('denies when ability predicate returns false', async () => {
    const gate = Gate.for(admin, testPolicy);
    expect(await gate.allows('update', resource)).toBe(false);
    expect(await gate.denies('update', resource)).toBe(true);
  });
  it('authorize resolves when ability is granted', async () => {
    const gate = Gate.for(owner, testPolicy);
    await expect(gate.authorize('update', resource)).resolves.toBeUndefined();
  });
  it('authorize throws AuthorizationError when ability is denied', async () => {
    const gate = Gate.for(admin, testPolicy);
    await expect(gate.authorize('update', resource)).rejects.toThrow(AuthorizationError);
  });
  it('AuthorizationError message is always "Unauthorized"', async () => {
    const gate = Gate.for(admin, testPolicy);
    try {
      await gate.authorize('update', resource);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthorizationError);
      expect(err.message).toBe('Unauthorized');
    }
  });
  it('denies unknown abilities', async () => {
    const gate = Gate.for(owner, testPolicy);
    expect(await gate.allows('nonexistent', resource)).toBe(false);
  });
  it('allows admin to delete', async () => {
    const gate = Gate.for(admin, testPolicy);
    expect(await gate.allows('delete')).toBe(true);
  });
});
describe('Gate.register / Gate.resolve', () => {
  const owner = { id: 'user-1', role: 'member' };
  const resource = { ownerId: 'user-1' };
  it('resolves a policy registered by name', () => {
    Gate.register('test-policy', testPolicy);
    expect(Gate.resolve('test-policy')).toBe(testPolicy);
  });
  it('returns undefined for an unregistered name', () => {
    expect(Gate.resolve('__nonexistent__')).toBeUndefined();
  });
  it('overwrites a previously registered policy with the same name', () => {
    const policyA = definePolicy({ update: () => true });
    const policyB = definePolicy({ update: () => false });
    Gate.register('overwrite-test', policyA);
    Gate.register('overwrite-test', policyB);
    expect(Gate.resolve('overwrite-test')).toBe(policyB);
  });
  it('resolved policy can be used with Gate.for()', async () => {
    Gate.register('resolved-test', testPolicy);
    const resolved = Gate.resolve('resolved-test');
    const gate = Gate.for(owner, resolved);
    expect(await gate.allows('update', resource)).toBe(true);
  });
});
//# sourceMappingURL=gate.test.js.map
