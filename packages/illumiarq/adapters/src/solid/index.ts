import { assertBetaEnabled, createAdapter } from '../web/shared.js';
import type { BetaAdapterOptions, FrameworkAdapter } from '../web/types.js';

export function createSolidAdapter(options: BetaAdapterOptions = {}): FrameworkAdapter {
  assertBetaEnabled('solid', options.enableBeta);
  return createAdapter('solid', 'beta', options.hydrateMode ?? 'islands');
}
