import type { MetaData, RenderMode, HandlerType, MiddlewareInput } from './types.js';import type { BindingDefinition } from './define-binding.js';

/** The shape of a route definition produced by defineRoute. */
export interface RouteDefinition {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  handler: HandlerType;
  middleware?: MiddlewareInput[];
  loaders?: HandlerType[];
  render?: RenderMode;
  revalidate?: number | false;
  generateParams?: () => Promise<Array<Record<string, string>>>;
  meta?: (ctx: {
    params: Record<string, string>;
    loaderData: Record<string, unknown>;
  }) => MetaData | Promise<MetaData>;
  name?: string;
  bind?: Record<string, BindingDefinition>;
  /** API version number (e.g. 1 for v1). Added automatically via Route.group({ version }). */
  version?: number;
  /** Mark this route as deprecated — clients should migrate away. */
  deprecated?: boolean;
  /** ISO 8601 date after which the route will be removed, e.g. '2026-01-01'. */
  sunset?: string;
}

/** Defines a route with its handler and optional rendering strategy. */
export function defineRoute(definition: RouteDefinition): RouteDefinition {
  return definition;
}
