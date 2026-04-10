import { describe, it, expect, beforeEach } from 'vitest';
import { setConnectionConfig, clearConnectionCache } from '../src/connection-factory.js';
import { BaseRepository } from '../src/base-repository.js';
import type { PaginateOptions, CursorPaginateOptions } from '../src/base-repository.js';

type Item = { id: string; name: string };

// Concrete repository exposing pagination methods for testing
class TestRepository extends BaseRepository<Item, { name: string }> {
  async findById(_id: string) {
    return null;
  }
  async findAll() {
    return [];
  }
  async create(input: { name: string }) {
    return { id: 'test-id', ...input };
  }
  async update(id: string, input: Partial<{ name: string }>) {
    return { id, name: input.name ?? 'updated' };
  }
  async delete(_id: string) {}

  testPaginate(items: Item[], total: number, options: PaginateOptions) {
    return this.paginate(items, total, options);
  }

  testCursorPaginate(
    items: Item[],
    getCursorId: (item: Item) => string,
    options: CursorPaginateOptions,
  ) {
    return this.cursorPaginate(items, getCursorId, options);
  }
}

function makeItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `item-${i + 1}` }));
}

let repo: TestRepository;

beforeEach(() => {
  setConnectionConfig({
    default: 'default',
    connections: { default: { url: ':memory:' } },
  });
  clearConnectionCache();
  repo = new TestRepository();
});

describe('BaseRepository — paginate()', () => {
  it('returns correct from/to/lastPage for first page', () => {
    const items = makeItems(10);
    const result = repo.testPaginate(items, 50, { page: 1, perPage: 10 });

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(50);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(10);
    expect(result.lastPage).toBe(5);
    expect(result.from).toBe(1);
    expect(result.to).toBe(10);
  });

  it('returns correct metadata for page 2 with perPage 5', () => {
    const items = makeItems(5);
    const result = repo.testPaginate(items, 25, { page: 2, perPage: 5 });

    expect(result.page).toBe(2);
    expect(result.perPage).toBe(5);
    expect(result.lastPage).toBe(5);
    expect(result.from).toBe(6);
    expect(result.to).toBe(10);
  });

  it('returns from: 0 and to: 0 when collection is empty', () => {
    const result = repo.testPaginate([], 0, { page: 1, perPage: 10 });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.from).toBe(0);
    expect(result.to).toBe(0);
  });

  it('clamps perPage to maxPerPage (100)', () => {
    const items = makeItems(100);
    const result = repo.testPaginate(items, 500, { page: 1, perPage: 9999 });

    expect(result.perPage).toBe(100);
  });

  it('clamps perPage minimum to 1', () => {
    const items = makeItems(1);
    const result = repo.testPaginate(items, 10, { page: 1, perPage: 0 });

    expect(result.perPage).toBe(1);
  });
});

describe('BaseRepository — cursorPaginate()', () => {
  const getId = (item: Item) => item.id;

  it('returns correct data slice and nextCursor when there are more items', () => {
    // Pass limit+1 items to indicate there are more
    const items = makeItems(3); // limit=2, so 3 items → hasMore=true
    const result = repo.testCursorPaginate(items, getId, { limit: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
    // nextCursor should be the base64-encoded id of the last item in data (item 2)
    expect(Buffer.from(result.nextCursor!, 'base64').toString()).toBe('2');
  });

  it('sets hasMore: true when more items are available', () => {
    const items = makeItems(5); // limit=3, 5 > 3 → hasMore=true
    const result = repo.testCursorPaginate(items, getId, { limit: 3 });

    expect(result.hasMore).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('sets hasMore: false when no more items are available', () => {
    const items = makeItems(2); // limit=5, 2 <= 5 → hasMore=false
    const result = repo.testCursorPaginate(items, getId, { limit: 5 });

    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(result.data).toHaveLength(2);
  });

  it('applies maxPerPage clamp (limit capped at 100)', () => {
    const items = makeItems(100);
    const result = repo.testCursorPaginate(items, getId, { limit: 9999 });

    expect(result.data).toHaveLength(100);
  });

  it('sets prevCursor when a cursor is provided in options', () => {
    const cursor = Buffer.from('1').toString('base64');
    const items = makeItems(3);
    const result = repo.testCursorPaginate(items, getId, { limit: 2, cursor });

    expect(result.prevCursor).not.toBeNull();
  });

  it('sets prevCursor to null when no cursor provided (first page)', () => {
    const items = makeItems(3);
    const result = repo.testCursorPaginate(items, getId, { limit: 2 });

    expect(result.prevCursor).toBeNull();
  });
});
