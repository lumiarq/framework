// ─── LumiARQ Deployment Adapters ────────────────────────────────────────────
//
// Each adapter is available as a dedicated sub-path import:
//
//   @illumiarq/adapters/node        — Node.js HTTP server
//   @illumiarq/adapters/vercel      — Vercel serverless functions
//   @illumiarq/adapters/cloudflare  — Cloudflare Workers
//   @illumiarq/adapters/fetch       — Bun / Deno / Lambda fn URLs (Web fetch)
//   @illumiarq/adapters/aws-lambda  — AWS Lambda (API Gateway v1/v2)
//   @illumiarq/adapters/static      — Static prerender pipeline
//
// All runtime adapters accept `LumiARQApp | Promise<LumiARQApp>` — the value
// returned by `boot()` — so no `.router` extraction is ever needed in app code.

export { startNodeServer } from './node/index.js';
export type { NodeAdapterOptions } from './node/index.js';

export { createVercelAdapter } from './vercel/index.js';

export { createCloudflareAdapter } from './cloudflare/index.js';
export type { CloudflareAdapterOptions } from './cloudflare/index.js';

export { createFetchAdapter } from './fetch/index.js';

export { createLambdaAdapter } from './aws-lambda/index.js';
export type { LambdaEvent, LambdaContext, LambdaResponse } from './aws-lambda/index.js';

export { planStaticBuild, generateHtaccess, generateNginxConf, generateBffScaffold } from './static/index.js';
export type {
  StaticBuildOptions,
  StaticBuildResult,
  ApacheOptions,
  NginxOptions,
  BffScaffoldOptions,
} from './static/index.js';
