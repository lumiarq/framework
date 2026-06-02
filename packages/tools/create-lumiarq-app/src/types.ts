export type Preset = 'api-only' | 'full-stack' | 'domain-only';

export const PRESETS: Preset[] = ['api-only', 'full-stack', 'domain-only'];

export type ScaffoldFile = {
  path: string;
  content: string;
};
