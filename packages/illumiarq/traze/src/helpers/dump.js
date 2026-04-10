import { inspect } from 'node:util';
export function formatDump(value) {
  return inspect(value, { depth: 6, colors: false, compact: false, sorted: true });
}
export function dump(...values) {
  for (const value of values) {
    console.log(formatDump(value));
  }
}
export function dd(...values) {
  dump(...values);
  throw new Error('Execution halted by dd().');
}
//# sourceMappingURL=dump.js.map
