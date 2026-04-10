import { describe, it, expect } from 'vitest';
import { generateBffScaffold } from '../src/static/bff-scaffold.js';
describe('generateBffScaffold', () => {
  it('returns a non-empty TypeScript string', () => {
    const code = generateBffScaffold();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });
  it('imports Hono', () => {
    expect(generateBffScaffold()).toContain("from 'hono'");
  });
  it('imports startNodeServer from lumiarq adapters', () => {
    expect(generateBffScaffold()).toContain('@illumiarqadapters/node');
  });
  it('creates a Hono app instance', () => {
    expect(generateBffScaffold()).toContain('new Hono()');
  });
  it('calls startNodeServer', () => {
    expect(generateBffScaffold()).toContain('startNodeServer');
  });
  it('uses the custom packageName in a comment', () => {
    const code = generateBffScaffold({ packageName: 'my-custom-app' });
    expect(code).toContain('my-custom-app');
  });
  it('includes request context imports when includeContext is true (default)', () => {
    const code = generateBffScaffold({ includeContext: true });
    expect(code).toContain('@illumiarqruntime');
    expect(code).toContain('runWithContext');
    expect(code).toContain('createRequestContext');
  });
  it('omits request context imports when includeContext is false', () => {
    const code = generateBffScaffold({ includeContext: false });
    expect(code).not.toContain('runWithContext');
    expect(code).not.toContain('createRequestContext');
  });
  it('produces valid-looking TypeScript — no syntax errors indicator', () => {
    const code = generateBffScaffold();
    // Basic structural checks
    expect(code).toContain('import');
    expect(code).toContain('const app');
    expect(code).toMatch(/startNodeServer\(app/);
  });
});
//# sourceMappingURL=bff-scaffold.test.js.map
