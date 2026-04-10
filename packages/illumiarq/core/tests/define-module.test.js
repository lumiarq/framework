import { describe, it, expect } from 'vitest';
import { defineModule } from '../src/module/define-module.js';
describe('defineModule', () => {
  it('returns a ModuleDefinition with name and defaults', () => {
    const def = defineModule({ name: 'Blog' });
    expect(def.name).toBe('Blog');
    expect(def.alias).toBe('blog');
    expect(def.priority).toBe(100);
    expect(def.prefix).toBeUndefined();
    expect(def.middleware).toEqual({});
  });
  it('derives alias from PascalCase name', () => {
    const def = defineModule({ name: 'UserProfile' });
    expect(def.alias).toBe('user-profile');
  });
  it('uses explicit alias when provided', () => {
    const def = defineModule({ name: 'Auth', alias: 'authentication' });
    expect(def.alias).toBe('authentication');
  });
  it('applies custom priority', () => {
    const def = defineModule({ name: 'Core', priority: 1 });
    expect(def.priority).toBe(1);
  });
  it('applies prefix when provided', () => {
    const def = defineModule({ name: 'Admin', prefix: '/admin' });
    expect(def.prefix).toBe('/admin');
  });
  it('applies middleware config when provided', () => {
    const def = defineModule({
      name: 'Dashboard',
      middleware: { web: ['lumiarq.auth'], api: ['lumiarq.auth'] },
    });
    expect(def.middleware.web).toEqual(['lumiarq.auth']);
    expect(def.middleware.api).toEqual(['lumiarq.auth']);
  });
  it('name with single word uses lowercase alias', () => {
    const def = defineModule({ name: 'IAM' });
    expect(def.alias).toBe('i-a-m');
  });
});
//# sourceMappingURL=define-module.test.js.map
