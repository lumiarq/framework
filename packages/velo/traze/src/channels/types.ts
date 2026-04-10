import type { LogEntry } from '../logger/types.js';

export interface ChannelOptions {
  path?: string;
  endpoint?: string;
  headers?: Record<string, string>;
  pretty?: boolean;
}

export interface HttpTransport {
  (
    input: string,
    init: { method: string; headers?: Record<string, string>; body: string },
  ): Promise<unknown>;
}

export interface Channel {
  handle(entry: LogEntry): void | Promise<void>;
}
