import { describe, it, expect } from 'vitest';
import {
  tinker,
  startTinker,
  readAppName,
  tryImport,
  evalCode,
  loadTinkerContext,
} from '../src/index.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
describe('tinker', () => {
  it('is a function', () => {
    expect(typeof tinker).toBe('function');
    expect(typeof startTinker).toBe('function');
  });
  it('returns a Promise', () => {
    // We don't actually await it (would start REPL), just check the return type
    expect(typeof tinker).toBe('function');
    const ret = tinker('/nonexistent-path-that-will-not-have-dist');
    expect(ret).toBeInstanceOf(Promise);
    // Clean up — the REPL will be started but we can't easily stop it in tests
    // so we just ignore the promise (it will hang waiting for .exit)
    ret.catch(() => {
      /* ignore */
    });
  });
});
describe('readAppName', () => {
  it('returns "App" when directory does not exist', () => {
    expect(readAppName('/nonexistent/path/xyz')).toBe('App');
  });
  it('returns "App" when no package.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinker-test-'));
    expect(readAppName(dir)).toBe('App');
  });
  it('reads app name from package.json', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinker-test-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'my-app' }));
    expect(readAppName(dir)).toBe('my-app');
  });
  it('returns "App" when package.json has no name field', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinker-test-'));
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ version: '1.0.0' }));
    expect(readAppName(dir)).toBe('App');
  });
  it('returns "App" when package.json is invalid JSON', () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinker-test-'));
    writeFileSync(join(dir, 'package.json'), 'not-json{{{');
    expect(readAppName(dir)).toBe('App');
  });
});
describe('tryImport', () => {
  it('returns null for non-existent module', async () => {
    const result = await tryImport('/nonexistent/module/path.js');
    expect(result).toBeNull();
  });
});
describe('evalCode', () => {
  it('evaluates expressions against the provided context', async () => {
    await expect(evalCode('value + 1', { value: 2 })).resolves.toBe(3);
  });
});
describe('loadTinkerContext', () => {
  it('returns an empty context when bootstrap output is missing', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tinker-context-'));
    await expect(loadTinkerContext(dir)).resolves.toEqual({ context: {}, loaded: [] });
  });
});
//# sourceMappingURL=tinker.test.js.map
