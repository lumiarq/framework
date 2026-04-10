import { describe, expect, it, vi } from 'vitest';
import { createLogger } from '../src/index.js';

describe('createLogger', () => {
  it('writes log entries to configured channels', async () => {
    const channel = { handle: vi.fn().mockResolvedValue(undefined) };
    const logger = createLogger({ channels: [channel], context: { app: 'test' } });

    await logger.info('hello', { requestId: '1' });

    expect(channel.handle).toHaveBeenCalledTimes(1);
    expect(channel.handle.mock.calls[0]?.[0].context).toMatchObject({
      app: 'test',
      requestId: '1',
    });
  });

  it('merges context functionally', async () => {
    const channel = { handle: vi.fn().mockResolvedValue(undefined) };
    const logger = createLogger({ channels: [channel], context: { app: 'root' } }).context({
      module: 'billing',
    });

    await logger.warn('warned');

    expect(channel.handle.mock.calls[0]?.[0].context).toMatchObject({
      app: 'root',
      module: 'billing',
    });
  });
});
