import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { MemoryFilesystemDriver, NodeFilesystemDriver } from '../src/index.js';

describe('MemoryFilesystemDriver', () => {
  let fsDriver: MemoryFilesystemDriver;

  beforeEach(() => {
    fsDriver = new MemoryFilesystemDriver();
  });

  it('read returns null on miss', async () => {
    expect(await fsDriver.read('missing.txt')).toBeNull();
  });

  it('write + read round-trip string', async () => {
    await fsDriver.write('a.txt', 'hello');
    const bytes = await fsDriver.read('a.txt');
    expect(bytes).not.toBeNull();
    expect(new TextDecoder().decode(bytes!)).toBe('hello');
  });

  it('write + read round-trip bytes', async () => {
    const bytes = new TextEncoder().encode('bytes');
    await fsDriver.write('b.bin', bytes);
    const got = await fsDriver.read('b.bin');
    expect(got).not.toBeNull();
    expect(new TextDecoder().decode(got!)).toBe('bytes');
  });

  it('delete removes file', async () => {
    await fsDriver.write('del.txt', 'x');
    expect(await fsDriver.exists('del.txt')).toBe(true);
    await fsDriver.delete('del.txt');
    expect(await fsDriver.exists('del.txt')).toBe(false);
  });
});

describe('NodeFilesystemDriver', () => {
  let tmpRoot: string;
  let driver: NodeFilesystemDriver;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'illumiarq-fs-'));
    driver = new NodeFilesystemDriver({ root: tmpRoot });
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('mkdirp creates nested directories', async () => {
    await driver.mkdirp('a/b');
    expect(fs.existsSync(path.join(tmpRoot, 'a', 'b'))).toBe(true);
  });

  it('write + read round-trip string', async () => {
    await driver.write('a/b/c.txt', 'hello');
    const got = await driver.read('a/b/c.txt');
    expect(got).not.toBeNull();
    expect(new TextDecoder().decode(got!)).toBe('hello');
  });

  it('exists + delete', async () => {
    await driver.write('x.txt', 'v');
    expect(await driver.exists('x.txt')).toBe(true);
    await driver.delete('x.txt');
    expect(await driver.exists('x.txt')).toBe(false);
  });
});
