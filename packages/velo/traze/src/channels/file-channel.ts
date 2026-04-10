import { appendFile } from 'node:fs/promises';
import type { LogEntry } from '../logger/types.js';
import type { Channel, ChannelOptions } from './types.js';

export function createFileChannel(options: ChannelOptions): Channel {
  return {
    async handle(entry: LogEntry): Promise<void> {
      if (!options.path) {
        throw new Error('createFileChannel requires a path option.');
      }

      const payload = options.pretty ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
      await appendFile(options.path, `${payload}\n`, 'utf8');
    },
  };
}
