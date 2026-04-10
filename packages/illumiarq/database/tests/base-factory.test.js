import { describe, it, expect } from 'vitest';
import { BaseFactory } from '../src/base-factory.js';
class ProductFactory extends BaseFactory {
  seq = 1;
  make(overrides) {
    return {
      id: `product-${this.seq++}`,
      title: 'Default Product',
      price: 9.99,
      ...overrides,
    };
  }
}
describe('BaseFactory — make()', () => {
  it('returns a single model instance with default values', () => {
    const factory = new ProductFactory();
    const product = factory.make();
    expect(product.id).toBe('product-1');
    expect(product.title).toBe('Default Product');
    expect(product.price).toBe(9.99);
  });
  it('applies partial overrides over defaults', () => {
    const factory = new ProductFactory();
    const product = factory.make({ title: 'Custom', price: 19.99 });
    expect(product.title).toBe('Custom');
    expect(product.price).toBe(19.99);
  });
  it('override of one field does not affect other default fields', () => {
    const factory = new ProductFactory();
    const product = factory.make({ title: 'Only Title' });
    expect(product.price).toBe(9.99);
  });
  it('sequential calls produce distinct instances', () => {
    const factory = new ProductFactory();
    const a = factory.make();
    const b = factory.make();
    expect(a).not.toBe(b);
    expect(a.id).not.toBe(b.id);
  });
});
describe('BaseFactory — makeMany()', () => {
  it('returns exactly the requested number of instances', () => {
    const factory = new ProductFactory();
    expect(factory.makeMany(5)).toHaveLength(5);
  });
  it('applies overrides to every instance', () => {
    const factory = new ProductFactory();
    const products = factory.makeMany(3, { price: 0 });
    expect(products.every((p) => p.price === 0)).toBe(true);
  });
  it('returns zero instances when count is 0', () => {
    const factory = new ProductFactory();
    expect(factory.makeMany(0)).toHaveLength(0);
  });
  it('each instance in makeMany is a distinct object reference', () => {
    const factory = new ProductFactory();
    const products = factory.makeMany(2);
    expect(products[0]).not.toBe(products[1]);
  });
});
//# sourceMappingURL=base-factory.test.js.map
