import { inspect } from 'node:util';

export function formatDump(value: unknown): string {
  return inspect(value, { depth: 6, colors: false, compact: false, sorted: true });
}

export function dump(...values: unknown[]): void {
  for (const value of values) {
    console.log(formatDump(value));
  }
}

export function dd(...values: unknown[]): never {
  dump(...values);
  throw new Error('Execution halted by dd().');
}
