import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { app } from '../src/app.js';
import type { AppEnvironment } from '../src/app.js';

describe('app() — Application environment helper', () => {
  let originalAppEnv: string | undefined;

  beforeEach(() => {
    originalAppEnv = process.env['APP_ENV'];
  });

  afterEach(() => {
    if (originalAppEnv === undefined) {
      delete process.env['APP_ENV'];
    } else {
      process.env['APP_ENV'] = originalAppEnv;
    }
  });

  // ─── singleton ──────────────────────────────────────────────────────────────

  it('app() always returns the same Application instance (singleton)', () => {
    expect(app()).toBe(app());
  });

  // ─── environment() ──────────────────────────────────────────────────────────

  it('defaults to "local" when APP_ENV is not set', () => {
    delete process.env['APP_ENV'];
    expect(app().environment()).toBe('local');
  });

  it('returns "local" when APP_ENV=local', () => {
    process.env['APP_ENV'] = 'local';
    expect(app().environment()).toBe('local');
  });

  it('returns "testing" when APP_ENV=testing', () => {
    process.env['APP_ENV'] = 'testing';
    expect(app().environment()).toBe('testing');
  });

  it('returns "staging" when APP_ENV=staging', () => {
    process.env['APP_ENV'] = 'staging';
    expect(app().environment()).toBe('staging');
  });

  it('returns "production" when APP_ENV=production', () => {
    process.env['APP_ENV'] = 'production';
    expect(app().environment()).toBe('production');
  });

  // ─── isLocal() ──────────────────────────────────────────────────────────────

  it('isLocal() returns true when APP_ENV=local', () => {
    process.env['APP_ENV'] = 'local';
    expect(app().isLocal()).toBe(true);
  });

  it('isLocal() returns true when APP_ENV is unset (defaults to local)', () => {
    delete process.env['APP_ENV'];
    expect(app().isLocal()).toBe(true);
  });

  it('isLocal() returns false when APP_ENV=production', () => {
    process.env['APP_ENV'] = 'production';
    expect(app().isLocal()).toBe(false);
  });

  // ─── isTesting() ────────────────────────────────────────────────────────────

  it('isTesting() returns true when APP_ENV=testing', () => {
    process.env['APP_ENV'] = 'testing';
    expect(app().isTesting()).toBe(true);
  });

  it('isTesting() returns false when APP_ENV=local', () => {
    process.env['APP_ENV'] = 'local';
    expect(app().isTesting()).toBe(false);
  });

  // ─── isStaging() ────────────────────────────────────────────────────────────

  it('isStaging() returns true when APP_ENV=staging', () => {
    process.env['APP_ENV'] = 'staging';
    expect(app().isStaging()).toBe(true);
  });

  it('isStaging() returns false when APP_ENV=production', () => {
    process.env['APP_ENV'] = 'production';
    expect(app().isStaging()).toBe(false);
  });

  // ─── isProduction() ─────────────────────────────────────────────────────────

  it('isProduction() returns true when APP_ENV=production', () => {
    process.env['APP_ENV'] = 'production';
    expect(app().isProduction()).toBe(true);
  });

  it('isProduction() returns false when APP_ENV=local', () => {
    process.env['APP_ENV'] = 'local';
    expect(app().isProduction()).toBe(false);
  });

  // ─── isEnvironment() ────────────────────────────────────────────────────────

  it('isEnvironment() returns true for a single matching env', () => {
    process.env['APP_ENV'] = 'staging';
    expect(app().isEnvironment('staging')).toBe(true);
  });

  it('isEnvironment() returns false for a single non-matching env', () => {
    process.env['APP_ENV'] = 'staging';
    expect(app().isEnvironment('production')).toBe(false);
  });

  it('isEnvironment() returns true when current env is one of multiple args', () => {
    process.env['APP_ENV'] = 'testing';
    expect(app().isEnvironment('local', 'testing')).toBe(true);
  });

  it('isEnvironment() returns false when current env is not in multiple args', () => {
    process.env['APP_ENV'] = 'production';
    expect(app().isEnvironment('local', 'testing', 'staging')).toBe(false);
  });

  it('isEnvironment() works with all four environments listed', () => {
    const envs: AppEnvironment[] = ['local', 'testing', 'staging', 'production'];
    process.env['APP_ENV'] = 'production';
    expect(app().isEnvironment(...envs)).toBe(true);
  });
});
