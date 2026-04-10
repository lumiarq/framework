import { describe, it, expect } from 'vitest';
import { createConnection } from '@illumiarq/database';
import type { LibSQLDatabase } from '@illumiarq/database';
import { BaseSeeder } from '../src/base-seeder.js';

class PassingSeeder extends BaseSeeder {
  readonly calls: number[] = [];

  async run(): Promise<void> {
    this.calls.push(Date.now());
  }
}

class FailingSeeder extends BaseSeeder {
  async run(): Promise<void> {
    throw new Error('database unavailable');
  }
}

const db: LibSQLDatabase = createConnection({ url: ':memory:' });

describe('BaseSeeder (migrations)', () => {
  it('run() resolves on first call', async () => {
    const seeder = new PassingSeeder(db);
    await expect(seeder.run()).resolves.toBeUndefined();
  });

  it('run() records each invocation independently', async () => {
    const seeder = new PassingSeeder(db);
    await seeder.run();
    await seeder.run();
    expect(seeder.calls).toHaveLength(2);
  });

  it('run() rejects with the implementation error', async () => {
    const seeder = new FailingSeeder(db);
    await expect(seeder.run()).rejects.toThrow('database unavailable');
  });

  it('accepts a LibSQLDatabase instance at construction without throwing', () => {
    expect(() => new PassingSeeder(db)).not.toThrow();
  });

  it('run() returns a Promise', () => {
    const seeder = new PassingSeeder(db);
    expect(seeder.run()).toBeInstanceOf(Promise);
  });
});
