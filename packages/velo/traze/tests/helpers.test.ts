import { describe, expect, it } from 'vitest';
import { formatBytes, formatDump, formatDuration } from '../src/index.js';

describe('helpers', () => {
  it('formats byte counts', () => {
    expect(formatBytes(2048)).toBe('2.00 KB');
  });

  it('formats durations', () => {
    expect(formatDuration(12.3456)).toBe('12.35ms');
  });

  it('formats values for dumping', () => {
    expect(formatDump({ b: 2, a: 1 })).toContain('a');
  });
});
