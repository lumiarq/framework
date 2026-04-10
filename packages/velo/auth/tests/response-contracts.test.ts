import { describe, it, expect } from 'vitest';
import * as authCore from '../src/index.js';

/**
 * Response contracts (LoginResponse, LogoutResponse, VerifyEmailResponse,
 * ConfirmPasswordResponse) are type-only exports — they carry no runtime value.
 * These tests verify that the module compiles with the new types in place and
 * that all expected runtime symbols are present alongside them.
 */
describe('Response contracts exported from @velo/auth', () => {
  it('module loads without errors (type exports compile correctly)', () => {
    expect(authCore).toBeDefined();
  });

  it('LoginResponse — companion runtime export BaseLoginAction is present', () => {
    expect(authCore).toHaveProperty('BaseLoginAction');
  });

  it('LogoutResponse — companion runtime export BaseLogoutAction is present', () => {
    expect(authCore).toHaveProperty('BaseLogoutAction');
  });

  it('VerifyEmailResponse — companion runtime export BaseVerifyEmailAction is present', () => {
    expect(authCore).toHaveProperty('BaseVerifyEmailAction');
  });

  it('ConfirmPasswordResponse — companion runtime export BaseConfirmPasswordAction is present', () => {
    expect(authCore).toHaveProperty('BaseConfirmPasswordAction');
  });
});
