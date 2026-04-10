import { describe, it, expect } from 'vitest';
import { composeMiddleware } from '../src/middleware/pipeline.js';
describe('middleware pipeline', () => {
  it('runs middleware in order', async () => {
    const calls = [];
    const pipeline = composeMiddleware([
      async (_req, next) => {
        calls.push('a');
        const res = await next();
        calls.push('a:after');
        return res;
      },
      async (_req, next) => {
        calls.push('b');
        return next();
      },
    ]);
    const res = await pipeline(new Request('https://example.test'), async () => {
      calls.push('handler');
      return new Response('ok');
    });
    expect(await res.text()).toBe('ok');
    expect(calls).toEqual(['a', 'b', 'handler', 'a:after']);
  });
});
//# sourceMappingURL=middleware.test.js.map
