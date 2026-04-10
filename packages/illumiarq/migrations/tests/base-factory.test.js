import { describe, it, expect } from 'vitest';
import { BaseFactory } from '../src/base-factory.js';
class WidgetFactory extends BaseFactory {
  nextId = 1;
  make(overrides) {
    return { id: this.nextId++, name: 'Widget', ...overrides };
  }
}
describe('BaseFactory', () => {
  it('make() returns a single instance', () => {
    const factory = new WidgetFactory();
    const w = factory.make();
    expect(w.id).toBe(1);
    expect(w.name).toBe('Widget');
  });
  it('make() applies overrides', () => {
    const factory = new WidgetFactory();
    const w = factory.make({ name: 'Custom' });
    expect(w.name).toBe('Custom');
  });
  it('makeMany() returns the correct count', () => {
    const factory = new WidgetFactory();
    const widgets = factory.makeMany(5);
    expect(widgets).toHaveLength(5);
  });
  it('makeMany() applies overrides to all instances', () => {
    const factory = new WidgetFactory();
    const widgets = factory.makeMany(3, { name: 'Bulk' });
    expect(widgets.every((w) => w.name === 'Bulk')).toBe(true);
  });
});
//# sourceMappingURL=base-factory.test.js.map
