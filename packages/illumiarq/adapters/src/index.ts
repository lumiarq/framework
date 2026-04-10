// Re-export adapter entry points for convenience
// Usage: import from '@illumiarq/adapters/node', '@illumiarq/adapters/cloudflare', or '@illumiarq/adapters/static'
export type { NodeAdapterOptions } from './node/index.js';
export type {
  StaticBuildOptions,
  StaticBuildResult,
  ApacheOptions,
  NginxOptions,
  BffScaffoldOptions,
} from './static/index.js';
