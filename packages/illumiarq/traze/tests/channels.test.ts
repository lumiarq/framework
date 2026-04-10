import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createFileChannel, createHttpChannel } from '../src/index.js';

describe('channels', () => {
  it('writes file logs', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'traze-'));
    const path = join(dir, 'traze.log');
    const channel = createFileChannel({ path });

    await channel.handle({
      level: 'info',
      message: 'saved',
      timestamp: new Date(),
    });

    const content = await readFile(path, 'utf8');
    expect(content).toContain('saved');
  });

  it('posts HTTP logs through the provided transport', async () => {
    const transport = vi.fn().mockResolvedValue({ ok: true });
    const channel = createHttpChannel({ endpoint: 'https://example.test/logs' }, transport);

    await channel.handle({
      level: 'error',
      message: 'boom',
      timestamp: new Date(),
    });

    expect(transport).toHaveBeenCalledTimes(1);
  });
});
