import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { MemoryKeyValueStorageDriver, NodeKeyValueStorageDriver } from '../src/index.js';

describe('MemoryKeyValueStorageDriver', () => {
  let store: MemoryKeyValueStorageDriver;

  beforeEach(() => {
    store = new MemoryKeyValueStorageDriver();
  });

  it('returns null on miss', async () => {
    expect(await store.get('missing')).toBeNull();
  });

  it('set + get round-trips JSON', async () => {
    await store.set('k', { a: 1, b: 'x' });
    expect(await store.get<{ a: number; b: string }>('k')).toEqual({ a: 1, b: 'x' });
  });

  it('exists and delete remove keys', async () => {
    await store.set('k', 123);
    expect(await store.exists('k')).toBe(true);
    await store.delete('k');
    expect(await store.exists('k')).toBe(false);
    expect(await store.get('k')).toBeNull();
  });
});

describe('NodeKeyValueStorageDriver', () => {
  let tmpRoot: string;
  let store: NodeKeyValueStorageDriver;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'illumiarq-kv-'));
    store = new NodeKeyValueStorageDriver({ root: tmpRoot });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('set + get round-trips values using filesystem JSON files', async () => {
    await store.set('k', { a: 1 });
    expect(await store.get<{ a: number }>('k')).toEqual({ a: 1 });
    expect(await store.exists('k')).toBe(true);
  });

  it('delete removes key file', async () => {
    await store.set('k2', 'value');
    expect(await store.exists('k2')).toBe(true);
    await store.delete('k2');
    expect(await store.exists('k2')).toBe(false);
    expect(await store.get('k2')).toBeNull();
  });
});
