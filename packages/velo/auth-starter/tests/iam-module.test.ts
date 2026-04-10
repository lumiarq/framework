import { describe, it, expect } from 'vitest';
import { generateIAMModule } from '../src/iam-module.js';

describe('generateIAMModule()', () => {
  const files = generateIAMModule();
  const paths = files.map((f) => f.path);
  const content = (end: string) => files.find((f) => f.path.endsWith(end))?.content ?? '';

  // ── File count ─────────────────────────────────────────────────────────────

  it('generates at least 20 files', () => {
    expect(files.length).toBeGreaterThanOrEqual(20);
  });

  // ── All paths inside IAM/ ──────────────────────────────────────────────────

  it('all paths are inside src/modules/IAM/', () => {
    for (const file of files) {
      expect(file.path).toMatch(/^src\/modules\/IAM\//);
    }
  });

  // ── No imports from @/modules/Auth or @/modules/User (invariant 69) ──────────

  it('does not import from @/modules/Auth', () => {
    for (const file of files) {
      expect(file.content).not.toMatch(/@modules\/Auth/);
    }
  });

  it('does not import from @/modules/User', () => {
    for (const file of files) {
      expect(file.content).not.toMatch(/@modules\/User/);
    }
  });

  // ── module.ts is present and correct ──────────────────────────────────────

  it('module.ts is included', () => {
    const mod = files.find((f) => f.path === 'src/modules/IAM/module.ts');
    expect(mod).toBeDefined();
    expect(mod!.content).toContain("name: 'IAM'");
    expect(mod!.content).toContain('export default');
    expect(mod!.content).toContain('defineModule');
  });

  // ── index.ts is present and correct ───────────────────────────────────────

  it('index.ts is included', () => {
    expect(paths.some((p) => p.endsWith('IAM/index.ts'))).toBe(true);
  });

  it('index.ts does NOT export tasks', () => {
    expect(content('IAM/index.ts')).not.toContain('Task');
  });

  it('index.ts does NOT export repositories', () => {
    expect(content('IAM/index.ts')).not.toContain('Repository');
  });

  it('index.ts does NOT export handlers', () => {
    expect(content('IAM/index.ts')).not.toContain('Handler');
  });

  it('index.ts does NOT export loaders', () => {
    expect(content('IAM/index.ts')).not.toContain('Loader');
  });

  // ── All 5 core actions ────────────────────────────────────────────────────

  it('generates all 5 action files', () => {
    const actions = ['login', 'register', 'logout', 'forgot-password', 'reset-password'];
    for (const a of actions) {
      expect(paths.some((p) => p.includes(`/logic/actions/${a}.action.ts`))).toBe(true);
    }
  });

  // ── All 5 handlers ────────────────────────────────────────────────────────

  it('generates all 5 handler files', () => {
    const handlers = ['login', 'register', 'logout', 'forgot-password', 'reset-password'];
    for (const h of handlers) {
      expect(paths.some((p) => p.includes(`/http/handlers/${h}.handler.ts`))).toBe(true);
    }
  });

  // ── Repositories ──────────────────────────────────────────────────────────

  it('generates both repository files', () => {
    expect(paths.some((p) => p.includes('identity.repository.ts'))).toBe(true);
    expect(paths.some((p) => p.includes('session.repository.ts'))).toBe(true);
  });

  it('identity.repository.ts implements IIdentityRepository', () => {
    expect(content('identity.repository.ts')).toContain('implements IIdentityRepository');
  });

  it('session.repository.ts implements ISessionRepository', () => {
    expect(content('session.repository.ts')).toContain('implements ISessionRepository');
  });

  // ── Events ────────────────────────────────────────────────────────────────

  it('generates 3 event definition files', () => {
    const events = ['user-registered', 'user-logged-in', 'password-reset'];
    for (const e of events) {
      expect(paths.some((p) => p.includes(`${e}.event.ts`))).toBe(true);
    }
  });

  it('user-registered.event.ts uses defineEvent with identityId in schema', () => {
    expect(content('user-registered.event.ts')).toContain('defineEvent');
    expect(content('user-registered.event.ts')).toContain('identityId');
  });

  // ── Routes ────────────────────────────────────────────────────────────────

  it('generates iam.api.ts and iam.web.ts', () => {
    expect(paths.some((p) => p.endsWith('IAM/http/routes/iam.api.ts'))).toBe(true);
    expect(paths.some((p) => p.endsWith('IAM/http/routes/iam.web.ts'))).toBe(true);
  });

  it('iam.api.ts uses Route facade for IAM routes', () => {
    expect(content('iam.api.ts')).toContain('Route');
  });

  // ── Session loader ────────────────────────────────────────────────────────

  it('generates session.loader.ts', () => {
    expect(paths.some((p) => p.includes('http/loaders/session.loader.ts'))).toBe(true);
  });

  // ── Handlers use sanitizeObject pipeline ──────────────────────────────────

  it('login.handler.ts uses sanitizeObject before validator', () => {
    const handler = content('login.handler.ts');
    expect(handler).toContain('sanitizeObject');
    expect(handler).toContain('LoginValidator');
  });

  it('register.handler.ts uses sanitizeObject before validator', () => {
    const handler = content('register.handler.ts');
    expect(handler).toContain('sanitizeObject');
    expect(handler).toContain('RegisterValidator');
  });

  // ── Actions import from @lumiarq/framework/auth ────────────────────────────────

  it('login.action.ts imports BaseLoginAction from @lumiarq/framework/auth', () => {
    const action = content('login.action.ts');
    expect(action).toContain("from '@lumiarq/framework/auth'");
    expect(action).toContain('BaseLoginAction');
  });

  it('register.action.ts imports BaseRegisterAction from @lumiarq/framework/auth', () => {
    const action = content('register.action.ts');
    expect(action).toContain("from '@lumiarq/framework/auth'");
    expect(action).toContain('BaseRegisterAction');
  });

  // ── auth-user.dto.ts — no passwordHash ───────────────────────────────────

  it('auth-user.dto.ts does NOT contain passwordHash', () => {
    expect(content('auth-user.dto.ts')).not.toContain('passwordHash');
  });

  // ── Policy ────────────────────────────────────────────────────────────────

  it('generates auth.policy.ts with IAMPolicy', () => {
    expect(paths.some((p) => p.includes('logic/policies/auth.policy.ts'))).toBe(true);
    expect(content('auth.policy.ts')).toContain('IAMPolicy');
  });

  // ── All files have non-empty content ─────────────────────────────────────

  it('all non-gitkeep files have non-empty content', () => {
    for (const file of files.filter((f) => !f.path.endsWith('.gitkeep'))) {
      expect(file.content.trim()).not.toBe('');
    }
  });
});
