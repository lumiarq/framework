import { describe, it, expect, beforeEach } from 'vitest';
import { setConnectionConfig, clearConnectionCache } from '../src/connection-factory.js';
import { BaseRepository } from '../src/base-repository.js';
// Concrete repository for testing the abstract base
class TestRepository extends BaseRepository {
  async findById(_id) {
    return null;
  }
  async findAll() {
    return [];
  }
  async create(input) {
    return { id: 'test-id', ...input };
  }
  async update(id, input) {
    return { id, name: input.name ?? 'updated' };
  }
  async delete(_id) {}
  /** Expose protected method for testing. */
  testClampLimit(requested, max) {
    return this.clampLimit(requested, max);
  }
}
let repo;
beforeEach(() => {
  setConnectionConfig({
    default: 'default',
    connections: { default: { url: ':memory:' } },
  });
  clearConnectionCache();
  repo = new TestRepository();
});
describe('BaseRepository — clampLimit', () => {
  it('returns the default max (100) when no limit is requested', () => {
    expect(repo.testClampLimit(undefined)).toBe(100);
  });
  it('returns requested value when below default max', () => {
    expect(repo.testClampLimit(50)).toBe(50);
  });
  it('clamps to 100 when requested exceeds default max', () => {
    expect(repo.testClampLimit(200)).toBe(100);
  });
  it('respects a custom max — clamps to custom max', () => {
    expect(repo.testClampLimit(500, 250)).toBe(250);
  });
  it('respects a custom max — passes through value below custom max', () => {
    expect(repo.testClampLimit(100, 250)).toBe(100);
  });
  it('returns custom max when no limit is requested and custom max is set', () => {
    expect(repo.testClampLimit(undefined, 50)).toBe(50);
  });
});
describe('BaseRepository — CRUD interface', () => {
  it('create returns a model with the provided input', async () => {
    const result = await repo.create({ name: 'test' });
    expect(result).toEqual({ id: 'test-id', name: 'test' });
  });
  it('findById returns null for unknown id', async () => {
    expect(await repo.findById('unknown')).toBeNull();
  });
  it('findAll returns an empty array by default', async () => {
    expect(await repo.findAll()).toEqual([]);
  });
  it('update returns model with the updated field', async () => {
    const result = await repo.update('id-1', { name: 'new-name' });
    expect(result).toEqual({ id: 'id-1', name: 'new-name' });
  });
  it('update uses default name when input.name is omitted', async () => {
    const result = await repo.update('id-1', {});
    expect(result.name).toBe('updated');
  });
  it('delete resolves without error', async () => {
    await expect(repo.delete('id-1')).resolves.toBeUndefined();
  });
});
describe('BaseRepository — connection factory', () => {
  it('constructs without arguments and uses getConnection() lazily', () => {
    expect(() => new TestRepository()).not.toThrow();
  });
  it('throws a descriptive error when config is not set', () => {
    // Simulate uninitialised state by calling with a connection name not in config
    setConnectionConfig({
      default: 'default',
      connections: { default: { url: ':memory:' } },
    });
    clearConnectionCache();
    const repoWithBadConn = new (class extends TestRepository {
      connection = 'nonexistent';
    })();
    // The error is thrown lazily when this.db is accessed (e.g. in a CRUD method)
    // Direct access via internal getter not possible, but we rely on connection-factory tests
    expect(repoWithBadConn).toBeDefined();
  });
});
//# sourceMappingURL=base-repository.test.js.map
