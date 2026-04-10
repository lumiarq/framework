import { describe, it, expect } from 'vitest';
import { createConnection } from '../src/connection.js';
import { BaseSeeder } from '../src/base-seeder.js';
class RecordingSeeder extends BaseSeeder {
  ran = false;
  async run() {
    this.ran = true;
  }
}
class ThrowingSeeder extends BaseSeeder {
  async run() {
    throw new Error('seed failed');
  }
}
describe('BaseSeeder', () => {
  const db = createConnection({ url: ':memory:' });
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
//# sourceMappingURL=base-seeder.test.js.map
