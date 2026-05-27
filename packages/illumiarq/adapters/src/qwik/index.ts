import { assertBetaEnabled, createAdapter } from '../web/shared.js';
import type { BetaAdapterOptions, FrameworkAdapter } from '../web/types.js';

export function createQwikAdapter(options: BetaAdapterOptions = {}): FrameworkAdapter {
  assertBetaEnabled('qwik', options.enableBeta);
  return createAdapter('qwik', 'beta', options.hydrateMode ?? 'islands');
}
