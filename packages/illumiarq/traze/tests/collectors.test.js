import { describe, expect, it } from 'vitest';
import {
  createCacheCollector,
  createEventCollector,
  createHttpCollector,
  createQueryCollector,
} from '../src/index.js';
describe('collectors', () => {
  it('collects HTTP, event, and cache entries', () => {
    const http = createHttpCollector();
    const events = createEventCollector();
    const cache = createCacheCollector();
    http.collect({ method: 'GET', path: '/', status: 200, durationMs: 10 });
    events.collect({ name: 'user.created' });
    cache.collect({ operation: 'hit', key: 'users:1' });
    expect(http.getEntries()).toHaveLength(1);
    expect(events.getEntries()).toHaveLength(1);
    expect(cache.getEntries()).toHaveLength(1);
  });
  it('detects repeated queries as n-plus-one warnings', () => {
    const queries = createQueryCollector();
    queries.collect({ sql: 'select * from posts where id = ?', durationMs: 1 });
    queries.collect({ sql: 'select * from posts where id = ?', durationMs: 2 });
    expect(queries.getWarnings()).toEqual([
      {
        sql: 'select * from posts where id = ?',
        count: 2,
        type: 'n-plus-one',
      },
    ]);
  });
});
//# sourceMappingURL=collectors.test.js.map
