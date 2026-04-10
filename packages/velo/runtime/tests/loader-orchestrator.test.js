import { describe, it, expect, vi } from 'vitest';
import { orchestrateLoaders, createRequestCache } from '../src/loader-orchestrator.js';
import { LoaderDependencyError } from '@velo/core';
// ─── Helper ───────────────────────────────────────────────────────────────────
function makeLoader(id, fetchFn, dependsOn = []) {
  return { id, fetch: fetchFn, dependsOn };
}
// ─── Parallel execution ───────────────────────────────────────────────────────
describe('orchestrateLoaders — parallel execution', () => {
  it('runs independent loaders in parallel (total time ≈ slowest, not sum)', async () => {
    const delay = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
    const slow = makeLoader('slow', () => delay(80, 'slow-result'));
    const medium = makeLoader('medium', () => delay(40, 'medium-result'));
    const fast = makeLoader('fast', () => delay(10, 'fast-result'));
    const start = Date.now();
    const results = await orchestrateLoaders([slow, medium, fast], {}, createRequestCache());
    const elapsed = Date.now() - start;
    expect(results.get('slow')).toBe('slow-result');
    expect(results.get('medium')).toBe('medium-result');
    expect(results.get('fast')).toBe('fast-result');
    // Sequential would take ~130ms; parallel takes ~80ms. Allow generous CI buffer.
    expect(elapsed).toBeLessThan(250);
  });
});
// ─── Request-scoped deduplication ────────────────────────────────────────────
describe('orchestrateLoaders — request-scoped deduplication', () => {
  it('executes the same loader only once per request cache', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');
    const loader = makeLoader('user', fetchFn);
    const cache = createRequestCache();
    await orchestrateLoaders([loader], { user: { id: '1' } }, cache);
    await orchestrateLoaders([loader], { user: { id: '1' } }, cache);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('does NOT deduplicate when input differs', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');
    const loader = makeLoader('user', fetchFn);
    const cache = createRequestCache();
    await orchestrateLoaders([loader], { user: { id: '1' } }, cache);
    await orchestrateLoaders([loader], { user: { id: '2' } }, cache);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
  it('property-order does NOT affect cache key (fast-json-stable-stringify)', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');
    const loader = makeLoader('profile', fetchFn);
    const cache = createRequestCache();
    // { b, a } and { a, b } differ by JSON.stringify but are equal by stable-stringify
    await orchestrateLoaders([loader], { profile: { b: 2, a: 1 } }, cache);
    await orchestrateLoaders([loader], { profile: { a: 1, b: 2 } }, cache);
    // Same canonical key despite different property order → single execution
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('fresh cache between requests — no cross-request deduplication', async () => {
    const fetchFn = vi.fn().mockResolvedValue('data');
    const loader = makeLoader('user', fetchFn);
    // Each request gets its own cache instance — no sharing
    await orchestrateLoaders([loader], { user: { id: '1' } }, createRequestCache());
    await orchestrateLoaders([loader], { user: { id: '1' } }, createRequestCache());
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
// ─── Dependency ordering (dependsOn) ─────────────────────────────────────────
describe('orchestrateLoaders — dependency ordering (dependsOn)', () => {
  it('runs dependent loader after its dependency resolves', async () => {
    const order = [];
    const userLoader = makeLoader('user', async () => {
      order.push('user');
      return { role: 'admin' };
    });
    const permLoader = makeLoader(
      'perms',
      async ({ deps }) => {
        const user = deps.get('user');
        order.push('perms');
        return user.role === 'admin' ? ['read', 'write'] : ['read'];
      },
      [userLoader],
    );
    const results = await orchestrateLoaders([userLoader, permLoader], {}, createRequestCache());
    expect(order).toEqual(['user', 'perms']);
    expect(results.get('perms')).toEqual(['read', 'write']);
  });
  it('deps Map is populated with resolved dependency data', async () => {
    const parentLoader = makeLoader('parent', async () => ({ value: 42 }));
    const childLoader = makeLoader(
      'child',
      async ({ deps }) => {
        const parent = deps.get('parent');
        return parent.value * 2;
      },
      [parentLoader],
    );
    const results = await orchestrateLoaders([parentLoader, childLoader], {}, createRequestCache());
    expect(results.get('child')).toBe(84);
  });
  it('shared dependency is dedup-executed even when two loaders depend on it', async () => {
    const sharedFn = vi.fn().mockResolvedValue({ role: 'user' });
    const shared = makeLoader('shared', sharedFn);
    const dependentA = makeLoader('A', async ({ deps }) => deps.get('shared'), [shared]);
    const dependentB = makeLoader('B', async ({ deps }) => deps.get('shared'), [shared]);
    await orchestrateLoaders([shared, dependentA, dependentB], {}, createRequestCache());
    // shared is a dep of both A and B — must only execute once
    expect(sharedFn).toHaveBeenCalledTimes(1);
  });
});
// ─── Cycle detection ─────────────────────────────────────────────────────────
describe('orchestrateLoaders — acyclic DAG validation', () => {
  it('throws LoaderDependencyError immediately on a direct self-reference', async () => {
    const selfRef = { id: 'self', fetch: async () => null, dependsOn: [] };
    selfRef.dependsOn = [selfRef];
    await expect(orchestrateLoaders([selfRef], {}, createRequestCache())).rejects.toThrow(
      LoaderDependencyError,
    );
  });
  it('throws LoaderDependencyError on a two-node cycle (A → B → A)', async () => {
    const loaderA = { id: 'A', fetch: async () => null, dependsOn: [] };
    const loaderB = { id: 'B', fetch: async () => null, dependsOn: [loaderA] };
    loaderA.dependsOn = [loaderB];
    await expect(orchestrateLoaders([loaderA, loaderB], {}, createRequestCache())).rejects.toThrow(
      LoaderDependencyError,
    );
  });
  it('error message contains the cycle path', async () => {
    const loaderA = { id: 'LoaderA', fetch: async () => null, dependsOn: [] };
    const loaderB = {
      id: 'LoaderB',
      fetch: async () => null,
      dependsOn: [loaderA],
    };
    loaderA.dependsOn = [loaderB];
    await expect(orchestrateLoaders([loaderA, loaderB], {}, createRequestCache())).rejects.toThrow(
      /LoaderA.*LoaderB|LoaderB.*LoaderA/,
    );
  });
  it('does NOT throw on a valid diamond dependency graph (A→C, B→C)', async () => {
    // Diamond is a DAG — not a cycle
    const base = makeLoader('base', async () => 'base');
    const left = makeLoader('left', async ({ deps }) => deps.get('base'), [base]);
    const right = makeLoader('right', async ({ deps }) => deps.get('base'), [base]);
    await expect(
      orchestrateLoaders([base, left, right], {}, createRequestCache()),
    ).resolves.toBeDefined();
  });
});
//# sourceMappingURL=loader-orchestrator.test.js.map
