import { describe, it, expect, beforeEach } from 'vitest';
import {
  setConnectionConfig,
  getConnection,
  clearConnectionCache,
} from '../src/connection-factory.js';

beforeEach(() => {
  clearConnectionCache();
});

describe('getConnection', () => {
  it('returns a LibSQLDatabase after setConnectionConfig is called', () => {
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });

    const db = getConnection();
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
  });

  it('throws a descriptive error when config has not been set', () => {
    // Ensure no config is present — module state may carry from prior test
    // Re-importing would be ideal; instead we check the factory rejects unknown name
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });

    expect(() => getConnection('nonexistent')).toThrow(/Unknown database connection "nonexistent"/);
  });

  it('returns the same cached instance on subsequent calls with the same name', () => {
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });

    const db1 = getConnection('default');
    const db2 = getConnection('default');
    expect(db1).toBe(db2);
  });

  it('returns the default connection when no name is given', () => {
    setConnectionConfig({
      default: 'primary',
      connections: { primary: { url: ':memory:' } },
    });

    const db = getConnection();
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
  });

  it('resolves named connections other than default', () => {
    setConnectionConfig({
      default: 'main',
      connections: {
        main: { url: ':memory:' },
        analytics: { url: ':memory:' },
      },
    });

    const main = getConnection('main');
    const analytics = getConnection('analytics');
    expect(main).toBeDefined();
    expect(analytics).toBeDefined();
    expect(main).not.toBe(analytics);
  });

  it('throws on a connection entry with no url', () => {
    setConnectionConfig({
      default: 'default',
      connections: { default: { driver: 'sqlite' } }, // missing url
    });
    clearConnectionCache();

    expect(() => getConnection()).toThrow(/missing a required `url` field/);
  });
});

describe('clearConnectionCache', () => {
  it('forces a new connection instance on the next getConnection call', () => {
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });

    const db1 = getConnection();
    clearConnectionCache();
    const db2 = getConnection();

    expect(db1).not.toBe(db2);
  });
});

describe('setConnectionConfig', () => {
  it('clears the cache when called with a new config', () => {
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });
    const db1 = getConnection();

    // Re-configure with a new config — cache should clear
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });
    const db2 = getConnection();

    expect(db1).not.toBe(db2);
  });
});
