import { describe, it, expect } from 'vitest';
import { createConnection } from '../src/connection.js';

describe('createConnection', () => {
  it('returns a Drizzle ORM instance with a select method', () => {
    const db = createConnection({ url: ':memory:' });
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
  });

  it('returns a Drizzle ORM instance with an insert method', () => {
    const db = createConnection({ url: ':memory:' });
    expect(typeof db.insert).toBe('function');
  });

  it('returns distinct instances per call (not a singleton)', () => {
    const db1 = createConnection({ url: ':memory:' });
    const db2 = createConnection({ url: ':memory:' });
    expect(db1).not.toBe(db2);
  });

  it('does not throw when authToken is omitted', () => {
    expect(() => createConnection({ url: ':memory:' })).not.toThrow();
  });

  it('accepts an explicit authToken option without throwing', () => {
    expect(() => createConnection({ url: ':memory:', authToken: 'test-token' })).not.toThrow();
  });
});
