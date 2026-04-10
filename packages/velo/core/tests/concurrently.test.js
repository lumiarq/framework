import { describe, it, expect } from 'vitest';
import { concurrently } from '../src/utils/concurrently.js';
describe('concurrently', () => {
  it('resolves all promises and returns them as a tuple in order', async () => {
    const [a, b, c] = await concurrently(
      Promise.resolve(1),
      Promise.resolve('two'),
      Promise.resolve(true),
    );
    expect(a).toBe(1);
    expect(b).toBe('two');
    expect(c).toBe(true);
  });
  it('rejects with the first failure (fail-fast like Promise.all)', async () => {
    const err = new Error('first fail');
    await expect(
      concurrently(Promise.resolve(1), Promise.reject(err), Promise.resolve(3)),
    ).rejects.toThrow('first fail');
  });
  it('handles a single promise', async () => {
    const result = await concurrently(Promise.resolve(42));
    expect(result).toEqual([42]);
  });
  it('handles three promises of different types', async () => {
    const result = await concurrently(
      Promise.resolve(100),
      Promise.resolve({ name: 'lumiarq' }),
      Promise.resolve(['a', 'b']),
    );
    expect(result[0]).toBe(100);
    expect(result[1]).toEqual({ name: 'lumiarq' });
    expect(result[2]).toEqual(['a', 'b']);
  });
});
//# sourceMappingURL=concurrently.test.js.map
