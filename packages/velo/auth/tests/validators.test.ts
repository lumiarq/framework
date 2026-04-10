import { describe, it, expect } from 'vitest';
import {
  BaseLoginValidator,
  BaseRegisterValidator,
  BaseResetPasswordValidator,
} from '../src/index.js';

describe('BaseLoginValidator', () => {
  it('accepts a valid email + password (8+ chars)', () => {
    const result = BaseLoginValidator.safeParse({ email: 'user@test.com', password: 'correct1' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = BaseLoginValidator.safeParse({ email: 'not-an-email', password: 'correct1' });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = BaseLoginValidator.safeParse({ email: 'user@test.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(BaseLoginValidator.safeParse({}).success).toBe(false);
    expect(BaseLoginValidator.safeParse({ email: 'u@e.com' }).success).toBe(false);
  });
});

describe('BaseRegisterValidator', () => {
  it('accepts valid registration data with matching passwords', () => {
    const result = BaseRegisterValidator.safeParse({
      email: 'user@test.com',
      password: 'securepass',
      confirmPassword: 'securepass',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = BaseRegisterValidator.safeParse({
      email: 'user@test.com',
      password: 'securepass',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('confirmPassword');
    }
  });

  it('rejects an invalid email', () => {
    const result = BaseRegisterValidator.safeParse({
      email: 'not-valid',
      password: 'securepass',
      confirmPassword: 'securepass',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = BaseRegisterValidator.safeParse({
      email: 'u@e.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('BaseResetPasswordValidator', () => {
  it('accepts valid reset password data with matching passwords', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: 'abc123token',
      email: 'user@test.com',
      password: 'newpassword',
      password_confirmation: 'newpassword',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing token', () => {
    const result = BaseResetPasswordValidator.safeParse({
      email: 'user@test.com',
      password: 'newpassword',
      password_confirmation: 'newpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty token', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: '',
      email: 'user@test.com',
      password: 'newpassword',
      password_confirmation: 'newpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: 'abc123token',
      email: 'not-an-email',
      password: 'newpassword',
      password_confirmation: 'newpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: 'abc123token',
      email: 'user@test.com',
      password: 'short',
      password_confirmation: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: 'abc123token',
      email: 'user@test.com',
      password: 'newpassword1',
      password_confirmation: 'newpassword2',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map((e) => e.path.join('.'));
      expect(paths).toContain('password_confirmation');
    }
  });

  it('rejects missing all fields', () => {
    expect(BaseResetPasswordValidator.safeParse({}).success).toBe(false);
  });

  it('rejects missing email', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: 'abc123token',
      password: 'newpassword',
      password_confirmation: 'newpassword',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing password_confirmation', () => {
    const result = BaseResetPasswordValidator.safeParse({
      token: 'abc123token',
      email: 'user@test.com',
      password: 'newpassword',
    });
    expect(result.success).toBe(false);
  });
});
