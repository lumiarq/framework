import { describe, it, expect, vi } from 'vitest';
import { createConnection } from '../src/connection.js';
import { BaseSeeder } from '../src/base-seeder.js';
import type { LibSQLDatabase } from '../src/connection.js';

class RecordingSeeder extends BaseSeeder {
  ran = false;

  async run(): Promise<void> {
    this.ran = true;
  }
}

class ThrowingSeeder extends BaseSeeder {
  async run(): Promise<void> {
    throw new Error('seed failed');
  }
}

describe('BaseSeeder', () => {
  const db: LibSQLDatabase = createConnection({ url: ':memory:' });

  it('run() executes and resolves when implementation succeeds', async () => {
    const seeder = new RecordingSeeder(db);
    await seeder.run();
    expect(seeder.ran).toBe(true);
  });

  it('stores the injected db on protected this.db (construction does not throw)', () => {
    expect(() => new RecordingSeeder(db)).not.toThrow();
  });

  it('run() propagates errors thrown by the implementation', async () => {
    const seeder = new ThrowingSeeder(db);
    await expect(seeder.run()).rejects.toThrow('seed failed');
  });

  it('multiple run() calls are independent (idempotency responsibility falls on subclass)', async () => {
    const seeder = new RecordingSeeder(db);
    await seeder.run();
    await seeder.run();
    // Both calls resolved — still ran is true
    expect(seeder.ran).toBe(true);
  });

  it('run() returns a Promise (async contract)', () => {
    const seeder = new RecordingSeeder(db);
    const result = seeder.run();
    expect(result).toBeInstanceOf(Promise);
  });
});
