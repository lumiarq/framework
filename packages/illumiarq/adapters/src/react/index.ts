import { createAdapter } from '../web/shared.js';
import type { FrameworkAdapter, HydrateMode } from '../web/types.js';

export interface ReactAdapterOptions {
  hydrateMode?: HydrateMode;
}

export function createReactAdapter(options: ReactAdapterOptions = {}): FrameworkAdapter {
  return createAdapter('react', 'ga', options.hydrateMode ?? 'full');
}
