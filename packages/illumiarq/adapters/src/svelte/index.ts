import { assertBetaEnabled, createAdapter } from '../web/shared.js';
import type { BetaAdapterOptions, FrameworkAdapter } from '../web/types.js';

export function createSvelteAdapter(options: BetaAdapterOptions = {}): FrameworkAdapter {
  assertBetaEnabled('svelte', options.enableBeta);
  return createAdapter('svelte', 'beta', options.hydrateMode ?? 'islands');
}
