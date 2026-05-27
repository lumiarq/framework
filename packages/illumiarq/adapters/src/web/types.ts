export type HydrateMode = 'none' | 'islands' | 'full';
export type AdapterTier = 'ga' | 'beta';

export interface FrameworkAdapter {
  framework: 'react' | 'vue' | 'svelte' | 'solid' | 'qwik';
  tier: AdapterTier;
  hydrateMode: HydrateMode;
  renderServer: (input: { component: string; props: Record<string, unknown> }) => Promise<string>;
  renderClientEntry: (input: { component: string; props: Record<string, unknown> }) => string;
  serializeProps: (props: Record<string, unknown>) => string;
}

export interface BetaAdapterOptions {
  enableBeta?: boolean;
  hydrateMode?: Exclude<HydrateMode, 'none'>;
}
