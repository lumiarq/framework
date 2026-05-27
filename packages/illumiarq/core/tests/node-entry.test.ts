import { describe, expect, it } from 'vitest';
import * as portable from '../src/index.js';
import * as node from '../src/node/index.js';

describe('@illumiarq/core/node entry (ADR-001)', () => {
  it('exposes Node affordances only on the /node subpath', () => {
    expect(node.resolveToolConfigPath).toBeTypeOf('function');
    expect(node.defineContentLoader).toBeTypeOf('function');
    expect(node.clearContentCache).toBeTypeOf('function');

    expect((portable as Record<string, unknown>).resolveToolConfigPath).toBeUndefined();
    expect((portable as Record<string, unknown>).defineContentLoader).toBeUndefined();
    expect((portable as Record<string, unknown>).clearContentCache).toBeUndefined();
  });

  it('keeps IRequest on the portable entry', () => {
    expect(portable.parseRequestUrl).toBeTypeOf('function');
  });
});
