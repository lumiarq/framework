import { createAdapter } from '../web/shared.js';
import type { FrameworkAdapter, HydrateMode } from '../web/types.js';

export interface VueAdapterOptions {
  hydrateMode?: HydrateMode;
}

export function createVueAdapter(options: VueAdapterOptions = {}): FrameworkAdapter {
  return createAdapter('vue', 'ga', options.hydrateMode ?? 'full');
}
