import type { LogEntry } from '../logger/types.js';
import type { Channel, ChannelOptions, HttpTransport } from './types.js';

const defaultTransport: HttpTransport = async (input, init) => fetch(input, init);

export function createHttpChannel(
  options: ChannelOptions,
  transport: HttpTransport = defaultTransport,
): Channel {
  return {
    async handle(entry: LogEntry): Promise<void> {
      if (!options.endpoint) {
        throw new Error('createHttpChannel requires an endpoint option.');
      }

      await transport(options.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(options.headers ?? {}),
        },
        body: JSON.stringify(entry),
      });
    },
  };
}
