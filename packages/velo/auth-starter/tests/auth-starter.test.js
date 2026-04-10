import { describe, it, expect } from 'vitest';
import { generateAuthModule } from '../src/auth-module.js';
import { generateUserModule } from '../src/user-module.js';
// ─── generateAuthModule ───────────────────────────────────────────────────────
describe('generateAuthModule', () => {
  const files = generateAuthModule();
  const paths = files.map((f) => f.path);
  const content = (end) => files.find((f) => f.path.endsWith(end))?.content ?? '';
  it('generates more than 20 files', () => {
    expect(files.length).toBeGreaterThan(20);
  });
  it('all paths are under src/modules/Auth/', () => {
    expect(paths.every((p) => p.startsWith('src/modules/Auth/'))).toBe(true);
  });
  // ── Structure ──────────────────────────────────────────────────────────────
  it('generates module.ts', () => {
    expect(paths.some((p) => p.endsWith('Auth/module.ts'))).toBe(true);
  });
  it('generates index.ts', () => {
    expect(paths.some((p) => p.endsWith('Auth/index.ts'))).toBe(true);
  });
  it('generates all 5 action files', () => {
    const actions = ['login', 'register', 'logout', 'forgot-password', 'reset-password'];
    for (const a of actions) {
      expect(paths.some((p) => p.includes(`/logic/actions/${a}.action.ts`))).toBe(true);
    }
  });
  it('generates all 5 handler files', () => {
    const handlers = ['login', 'register', 'logout', 'forgot-password', 'reset-password'];
    for (const h of handlers) {
      expect(paths.some((p) => p.includes(`/http/handlers/${h}.handler.ts`))).toBe(true);
    }
  });
  it('generates both repository files', () => {
    expect(paths.some((p) => p.includes('identity.repository.ts'))).toBe(true);
    expect(paths.some((p) => p.includes('session.repository.ts'))).toBe(true);
  });
  it('generates 3 event definition files', () => {
    const events = ['user-registered', 'user-logged-in', 'password-reset'];
    for (const e of events) {
      expect(paths.some((p) => p.includes(`${e}.event.ts`))).toBe(true);
    }
  });
  it('generates auth.api.ts and auth.web.ts', () => {
    expect(paths.some((p) => p.endsWith('Auth/http/routes/auth.api.ts'))).toBe(true);
    expect(paths.some((p) => p.endsWith('Auth/http/routes/auth.web.ts'))).toBe(true);
  });
  // ── index.ts — exports only actions, models, events, types ──
  it('index.ts does NOT export tasks', () => {
    const idx = content('Auth/index.ts');
    expect(idx).not.toContain('Task');
  });
  it('index.ts does NOT export repositories', () => {
    const idx = content('Auth/index.ts');
    expect(idx).not.toContain('Repository');
  });
  it('index.ts does NOT export handlers', () => {
    const idx = content('Auth/index.ts');
    expect(idx).not.toContain('Handler');
  });
  it('index.ts does NOT export loaders', () => {
    const idx = content('Auth/index.ts');
    expect(idx).not.toContain('Loader');
  });
  // ── passwordHash never in AuthUser ─────────────────────────
  it('auth-user.dto.ts does NOT contain passwordHash', () => {
    const dto = content('auth-user.dto.ts');
    expect(dto).not.toContain('passwordHash');
  });
  // ── UserRegistered event uses defineEvent with correct payload ───────────
  it('user-registered.event.ts uses defineEvent with identityId in schema', () => {
    const ev = content('user-registered.event.ts');
    expect(ev).toContain('defineEvent');
    expect(ev).toContain('identityId');
  });
  // ── Actions import from @lumiarq/framework/auth (not from core directly) ────────
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
  // ── Repositories implement the contracts ──────────────────────────────────
  it('identity.repository.ts implements IIdentityRepository', () => {
    const repo = content('identity.repository.ts');
    expect(repo).toContain('implements IIdentityRepository');
  });
  it('session.repository.ts implements ISessionRepository', () => {
    const repo = content('session.repository.ts');
    expect(repo).toContain('implements ISessionRepository');
  });
});
// ─── generateUserModule ───────────────────────────────────────────────────────
describe('generateUserModule', () => {
  const files = generateUserModule();
  const paths = files.map((f) => f.path);
  const content = (end) => files.find((f) => f.path.endsWith(end))?.content ?? '';
  it('generates more than 15 files', () => {
    expect(files.length).toBeGreaterThan(15);
  });
  it('all paths are under src/modules/User/', () => {
    expect(paths.every((p) => p.startsWith('src/modules/User/'))).toBe(true);
  });
  // ── Structure ──────────────────────────────────────────────────────────────
  it('generates module.ts and index.ts', () => {
    expect(paths.some((p) => p.endsWith('User/module.ts'))).toBe(true);
    expect(paths.some((p) => p.endsWith('User/index.ts'))).toBe(true);
  });
  it('generates user.model.ts (user profile — not identity)', () => {
    const model = content('user.model.ts');
    expect(model).toContain('identityId'); // FK to Identity
    expect(model).toContain('displayName');
    expect(model).not.toContain('passwordHash'); // never on user profile
  });
  it('generates user-registered.listener.ts', () => {
    expect(paths.some((p) => p.includes('user-registered.listener.ts'))).toBe(true);
  });
  // ── listener is idempotent ────────────────────────────────
  it('user-registered.listener.ts has an idempotency guard', () => {
    const listener = content('user-registered.listener.ts');
    expect(listener).toContain('idempotency');
  });
  // ── index.ts exports no tasks, repos, handlers, loaders ──
  it('index.ts does NOT export tasks', () => {
    const idx = content('User/index.ts');
    expect(idx).not.toContain('Task');
  });
  it('index.ts does NOT export repositories', () => {
    const idx = content('User/index.ts');
    expect(idx).not.toContain('Repository');
  });
  it('index.ts does NOT export handlers', () => {
    const idx = content('User/index.ts');
    expect(idx).not.toContain('Handler');
  });
  // ── User is profile data, not auth ────────────────────────────────────────
  it('does NOT generate login.action.ts or register.action.ts', () => {
    expect(paths.some((p) => p.includes('login.action.ts'))).toBe(false);
    expect(paths.some((p) => p.includes('register.action.ts'))).toBe(false);
  });
  it('generates profile-management actions', () => {
    expect(paths.some((p) => p.includes('create-user-profile.action.ts'))).toBe(true);
    expect(paths.some((p) => p.includes('update-user-profile.action.ts'))).toBe(true);
    expect(paths.some((p) => p.includes('delete-user-account.action.ts'))).toBe(true);
  });
  // ── Query layer — no Repository in Handlers or Listeners ─────────────────
  it('generates get-profile.query.ts in logic/queries/', () => {
    expect(paths.some((p) => p.includes('logic/queries/get-profile.query.ts'))).toBe(true);
  });
  it('get-profile.handler.ts uses GetProfileQuery (not UserRepository)', () => {
    const handler = content('get-profile.handler.ts');
    expect(handler).toContain('GetProfileQuery');
    expect(handler).not.toContain('UserRepository');
  });
  it('get-profile.loader.ts uses GetProfileQuery (not UserRepository)', () => {
    const loader = content('get-profile.loader.ts');
    expect(loader).toContain('GetProfileQuery');
    expect(loader).not.toContain('UserRepository');
  });
  it('user-registered.listener.ts uses GetProfileQuery for idempotency (not UserRepository)', () => {
    const listener = content('user-registered.listener.ts');
    expect(listener).toContain('GetProfileQuery');
    expect(listener).not.toContain('UserRepository');
  });
});
//# sourceMappingURL=auth-starter.test.js.map
