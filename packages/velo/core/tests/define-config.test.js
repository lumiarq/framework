import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { defineConfig } from '../src/config/define-config.js';
describe('defineConfig', () => {
  it('returns a frozen object matching the schema', () => {
    const schema = z.object({ port: z.number(), host: z.string() });
    const config = defineConfig(schema, { port: 3000, host: 'localhost' });
    expect(config.port).toBe(3000);
    expect(config.host).toBe('localhost');
    expect(Object.isFrozen(config)).toBe(true);
  });
  it('throws ZodError when values fail validation', () => {
    const schema = z.object({ port: z.number() });
    // @ts-expect-error — intentional invalid type for test
    expect(() => defineConfig(schema, { port: 'not-a-number' })).toThrow();
  });
  it('prevents mutation of returned config', () => {
    const schema = z.object({ name: z.string() });
    const config = defineConfig(schema, { name: 'lumiarq' });
    expect(() => {
      // @ts-expect-error — intentional mutation attempt
      config.name = 'changed';
    }).toThrow();
  });
});
//# sourceMappingURL=define-config.test.js.map
