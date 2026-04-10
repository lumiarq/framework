import { describe, it, expect } from 'vitest';
import {
  runWithContext,
  getContext,
  setApplicationContext,
  createRequestContext,
  createJobContext,
  createCommandContext,
  createTestContext,
  enableAudit,
  getAuditTrail,
  logAuditEntry,
  withContext,
  getRequestId,
  getUserId,
} from '../src/index.js';
// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildContext(overrides = {}) {
  return createRequestContext({
    headers: overrides.contextId ? { 'x-request-id': overrides.contextId } : {},
  });
}
// ─── runWithContext + getContext ───────────────────────────────────────────────
describe('runWithContext + getContext', () => {
  it('returns the context set by the enclosing runWithContext call', () => {
    const ctx = buildContext({ contextId: 'req-abc' });
    runWithContext(ctx, () => {
      const got = getContext();
      expect(got.contextId).toBe('req-abc');
    });
  });
  it('runs the provided function and returns its return value', () => {
    const ctx = buildContext();
    const result = runWithContext(ctx, () => 42);
    expect(result).toBe(42);
  });
  it('works with async functions — context is available inside async callbacks', async () => {
    const ctx = buildContext({ contextId: 'async-req' });
    await runWithContext(ctx, async () => {
      await Promise.resolve(); // yield
      const got = getContext();
      expect(got.contextId).toBe('async-req');
    });
  });
});
// ─── getContext — never throws (v4.2 behaviour) ───────────────────────────────
describe('getContext outside any runWithContext scope', () => {
  it('returns an ambient context instead of throwing', () => {
    // Must not throw — returns a default command context
    expect(() => getContext()).not.toThrow();
  });
  it('ambient context has contextType "command"', () => {
    const ctx = getContext();
    expect(ctx.contextType).toBe('command');
  });
  it('ambient context has a valid UUID contextId', () => {
    const ctx = getContext();
    expect(ctx.contextId).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('ambient context is unauthenticated', async () => {
    const ctx = getContext();
    expect(ctx.auth.isAuthenticated).toBe(false);
    expect(await ctx.auth.getUser()).toBeNull();
  });
  it('ambient locale defaults to en', () => {
    expect(getContext().locale).toBe('en');
  });
});
// ─── setApplicationContext ────────────────────────────────────────────────────
describe('setApplicationContext', () => {
  it('returns the application context when called outside any runWithContext scope', () => {
    const appCtx = createCommandContext({ commandId: 'boot-context' });
    setApplicationContext(appCtx);
    // Outside any ALS scope, getContext() should return the applicationContext
    const ctx = getContext();
    expect(ctx.contextId).toBe('boot-context');
    // Reset by setting a new ambient context
    setApplicationContext(createCommandContext({}));
  });
  it('ALS scope takes precedence over applicationContext', () => {
    const appCtx = createCommandContext({ commandId: 'app-ctx' });
    setApplicationContext(appCtx);
    const requestCtx = buildContext({ contextId: 'request-ctx' });
    runWithContext(requestCtx, () => {
      expect(getContext().contextId).toBe('request-ctx');
    });
    // Reset
    setApplicationContext(createCommandContext({}));
  });
});
// ─── contextType discrimination ───────────────────────────────────────────────
describe('contextType field', () => {
  it('createRequestContext sets contextType to "request"', () => {
    const ctx = createRequestContext({});
    expect(ctx.contextType).toBe('request');
  });
  it('createJobContext sets contextType to "job"', () => {
    const ctx = createJobContext({});
    expect(ctx.contextType).toBe('job');
  });
  it('createCommandContext sets contextType to "command"', () => {
    const ctx = createCommandContext({});
    expect(ctx.contextType).toBe('command');
  });
  it('createTestContext sets contextType to "test"', () => {
    const ctx = createTestContext({});
    expect(ctx.contextType).toBe('test');
  });
});
// ─── Context immutability ──────────────────────────────────────────────────────
describe('context immutability', () => {
  it('context object is frozen — mutation throws in strict mode', () => {
    const ctx = buildContext({ contextId: 'frozen-req' });
    runWithContext(ctx, () => {
      const got = getContext();
      expect(() => {
        got['contextId'] = 'mutated';
      }).toThrow(TypeError);
    });
  });
  it('createRequestContext produces a frozen object', () => {
    const ctx = createRequestContext({ headers: { 'x-request-id': 'immutable-id' } });
    expect(ctx.contextId).toBe('immutable-id');
    expect(Object.isFrozen(ctx)).toBe(true);
  });
});
// ─── Concurrent request isolation ─────────────────────────────────────────────
describe('concurrent request isolation', () => {
  it('two simultaneous async requests carry independent contexts', async () => {
    const seenIds = [];
    async function simulateRequest(id, delayMs) {
      const ctx = buildContext({ contextId: id });
      await runWithContext(ctx, async () => {
        await new Promise((r) => setTimeout(r, delayMs));
        seenIds.push(getContext().contextId);
      });
    }
    await Promise.all([simulateRequest('slow-request', 60), simulateRequest('fast-request', 10)]);
    expect(seenIds).toHaveLength(2);
    expect(seenIds).toContain('slow-request');
    expect(seenIds).toContain('fast-request');
  });
  it('three concurrent requests never cross-contaminate', async () => {
    const results = new Map();
    const ids = ['req-1', 'req-2', 'req-3'];
    await Promise.all(
      ids.map(async (id) => {
        const ctx = buildContext({ contextId: id });
        await runWithContext(ctx, async () => {
          await new Promise((r) => setTimeout(r, Math.random() * 30));
          results.set(id, getContext().contextId);
        });
      }),
    );
    for (const id of ids) {
      expect(results.get(id)).toBe(id);
    }
  });
});
// ─── createRequestContext ──────────────────────────────────────────────────────
describe('createRequestContext', () => {
  it('uses x-request-id header when present', () => {
    const ctx = createRequestContext({ headers: { 'x-request-id': 'from-header' } });
    expect(ctx.contextId).toBe('from-header');
  });
  it('auto-generates a UUID contextId when x-request-id is absent', () => {
    const ctx = createRequestContext({});
    expect(ctx.contextId).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('sets startedAt to the current date', () => {
    const before = Date.now();
    const ctx = createRequestContext({});
    const after = Date.now();
    expect(ctx.startedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(ctx.startedAt.getTime()).toBeLessThanOrEqual(after);
  });
  it('defaults to unauthenticated auth context', async () => {
    const ctx = createRequestContext({});
    expect(ctx.auth.isAuthenticated).toBe(false);
    expect(await ctx.auth.getUser()).toBeNull();
  });
  it('accepts a custom auth context', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com', role: 'admin' };
    const ctx = createRequestContext({
      auth: {
        isAuthenticated: true,
        getUser: async () => mockUser,
      },
    });
    expect(ctx.auth.isAuthenticated).toBe(true);
    expect(await ctx.auth.getUser()).toEqual(mockUser);
  });
});
// ─── createJobContext ──────────────────────────────────────────────────────────
describe('createJobContext', () => {
  it('uses provided jobId', () => {
    const ctx = createJobContext({ jobId: 'job-123' });
    expect(ctx.contextId).toBe('job-123');
  });
  it('auto-generates a UUID when jobId is absent', () => {
    const ctx = createJobContext({});
    expect(ctx.contextId).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('is unauthenticated', async () => {
    const ctx = createJobContext({});
    expect(ctx.auth.isAuthenticated).toBe(false);
    expect(await ctx.auth.getUser()).toBeNull();
  });
});
// ─── createCommandContext ─────────────────────────────────────────────────────
describe('createCommandContext', () => {
  it('uses provided commandId', () => {
    const ctx = createCommandContext({ commandId: 'cmd-abc' });
    expect(ctx.contextId).toBe('cmd-abc');
  });
  it('auto-generates a UUID when commandId is absent', () => {
    const ctx = createCommandContext({});
    expect(ctx.contextId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
// ─── createTestContext ────────────────────────────────────────────────────────
describe('createTestContext', () => {
  it('sets contextType to "test"', () => {
    expect(createTestContext({}).contextType).toBe('test');
  });
  it('uses provided testId', () => {
    const ctx = createTestContext({ testId: 'test-xyz' });
    expect(ctx.contextId).toBe('test-xyz');
  });
  it('is unauthenticated', async () => {
    const ctx = createTestContext({});
    expect(ctx.auth.isAuthenticated).toBe(false);
  });
});
describe('audit helpers', () => {
  it('stores audit entries when audit is enabled', async () => {
    const ctx = createRequestContext({ headers: { 'x-request-id': 'audit-ctx' } });
    await runWithContext(ctx, async () => {
      enableAudit();
      await logAuditEntry('post.created', { postId: '1' });
      expect(getAuditTrail()).toHaveLength(1);
      expect(getAuditTrail()[0]?.action).toBe('post.created');
    });
  });
});
describe('context helpers', () => {
  it('withContext delegates to runWithContext', () => {
    const ctx = createRequestContext({ headers: { 'x-request-id': 'helper-ctx' } });
    withContext(ctx, () => {
      expect(getRequestId()).toBe('helper-ctx');
    });
  });
  it('getUserId returns undefined for unauthenticated contexts', async () => {
    const ctx = createRequestContext({ headers: { 'x-request-id': 'user-ctx' } });
    await runWithContext(ctx, async () => {
      await expect(getUserId()).resolves.toBeUndefined();
    });
  });
});
//# sourceMappingURL=context.test.js.map
