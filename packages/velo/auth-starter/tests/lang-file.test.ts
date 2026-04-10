import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateLangFile } from '../src/lang-file.js';

// ---------------------------------------------------------------------------
// Temp directory helpers
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'lumis-lang-file-'));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateLangFile', () => {
  it('returns path lang/en.json', () => {
    const file = generateLangFile(tmpDir);
    expect(file.path).toBe('lang/en.json');
  });

  it('content is valid JSON', () => {
    const file = generateLangFile(tmpDir);
    expect(() => JSON.parse(file.content)).not.toThrow();
  });

  it('contains auth.failed key', () => {
    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    expect(json['auth.failed']).toBeDefined();
    expect(typeof json['auth.failed']).toBe('string');
  });

  it('contains auth.throttle key', () => {
    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    expect(json['auth.throttle']).toBeDefined();
    expect(json['auth.throttle']).toContain(':seconds');
  });

  it('contains validation.required key', () => {
    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    expect(json['validation.required']).toBeDefined();
    expect(json['validation.required']).toContain(':field');
  });

  it('contains all 18 auth.* keys', () => {
    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    const authKeys = Object.keys(json).filter((k) => k.startsWith('auth.'));
    expect(authKeys).toHaveLength(18);
  });

  it('contains all 6 validation.* keys', () => {
    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    const validationKeys = Object.keys(json).filter((k) => k.startsWith('validation.'));
    expect(validationKeys).toHaveLength(6);
  });

  it('content ends with a trailing newline', () => {
    const file = generateLangFile(tmpDir);
    expect(file.content.endsWith('\n')).toBe(true);
  });

  it('when project has existing lang/en.json, existing keys are preserved in output', () => {
    // Set up an existing lang/en.json in the temp dir.
    mkdirSync(join(tmpDir, 'lang'), { recursive: true });
    writeFileSync(
      join(tmpDir, 'lang', 'en.json'),
      JSON.stringify({ 'custom.greeting': 'Hello, :name!' }, null, 2) + '\n',
      'utf-8',
    );

    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    expect(json['custom.greeting']).toBe('Hello, :name!');
    // Default keys are also present.
    expect(json['auth.failed']).toBeDefined();
  });

  it('when project has a conflicting key, existing value wins over default', () => {
    mkdirSync(join(tmpDir, 'lang'), { recursive: true });
    writeFileSync(
      join(tmpDir, 'lang', 'en.json'),
      JSON.stringify({ 'auth.failed': 'Custom override message.' }, null, 2) + '\n',
      'utf-8',
    );

    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    expect(json['auth.failed']).toBe('Custom override message.');
  });

  it('merge is additive — all default keys present unless overridden', () => {
    mkdirSync(join(tmpDir, 'lang'), { recursive: true });
    // Only override one key; all others should still appear.
    writeFileSync(
      join(tmpDir, 'lang', 'en.json'),
      JSON.stringify({ 'auth.failed': 'Override.' }, null, 2) + '\n',
      'utf-8',
    );

    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    // The overridden key uses the existing value.
    expect(json['auth.failed']).toBe('Override.');
    // All other defaults are still present.
    expect(json['auth.throttle']).toBeDefined();
    expect(json['validation.required']).toBeDefined();
    expect(json['validation.unique']).toBeDefined();
  });

  it('handles malformed existing lang/en.json gracefully (uses defaults only)', () => {
    mkdirSync(join(tmpDir, 'lang'), { recursive: true });
    writeFileSync(join(tmpDir, 'lang', 'en.json'), '{ this is not valid json', 'utf-8');

    const file = generateLangFile(tmpDir);
    expect(() => JSON.parse(file.content)).not.toThrow();
    const json = JSON.parse(file.content) as Record<string, string>;
    expect(json['auth.failed']).toBeDefined();
  });

  it('when no existing file, does not include extraneous keys', () => {
    const file = generateLangFile(tmpDir);
    const json = JSON.parse(file.content) as Record<string, string>;
    const keys = Object.keys(json);
    // All keys should be auth.* or validation.*
    expect(keys.every((k) => k.startsWith('auth.') || k.startsWith('validation.'))).toBe(true);
  });
});
