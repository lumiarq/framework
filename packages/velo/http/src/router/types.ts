import type { BindingDefinition } from './define-binding.js';
import type { MiddlewareFn, MiddlewareInput } from '../types/http.types.js';

export type { MiddlewareInput };

/**
 * Meta data returned by a route's meta() function.
 */
export interface MetaData {
  title?: string;
  description?: string;
  og?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };
  jsonLd?: Record<string, unknown>;
  meta?: Array<{ name?: string; property?: string; content: string }>;
}

/** Render mode for web routes. */
export type RenderMode = 'static' | 'dynamic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandlerType = (...args: any[]) => unknown | Promise<unknown>;

export interface WebRouteOptions {
  render: RenderMode;
  revalidate?: number | false;
  loaders?: HandlerType[];
  middleware?: MiddlewareInput[];
  generateParams?: () => Promise<Array<Record<string, string>>>;
  meta?: (ctx: {
    params: Record<string, string>;
    loaderData: Record<string, unknown>;
  }) => MetaData | Promise<MetaData>;
  name?: string;
  bind?: Record<string, BindingDefinition>;
  deprecated?: boolean;
  sunset?: string;
}

export interface ApiRouteOptions {
  middleware?: MiddlewareInput[];
  name?: string;
  bind?: Record<string, BindingDefinition>;
  deprecated?: boolean;
  sunset?: string;
}

export interface RouteMatch {
  matched: boolean;
  params: Record<string, string>;
}

// ── Route.group() ────────────────────────────────────────────────────────────

/** Options for Route.group(). All fields are inherited by every route in the callback. */
export interface RouteGroupOptions {
  /** URL prefix prepended to every route path in the group. e.g. '/api/v1' */
  prefix?: string;
  /** Middleware keys applied to every route in the group before per-route middleware. */
  middleware?: MiddlewareInput[];
  /** API version number. Stored on each RouteDefinition for route:list and tooling. */
  version?: number;
  /** Mark every route in the group as deprecated. */
  deprecated?: boolean;
  /** ISO 8601 sunset date applied to every route in the group, e.g. '2026-01-01'. */
  sunset?: string;
}

// ── Route.resource() ─────────────────────────────────────────────────────────

/** The seven standard resource actions. */
export type ResourceAction = 'index' | 'create' | 'store' | 'show' | 'edit' | 'update' | 'destroy';

/**
 * Handler map for resource routes.
 * All handlers are optional — omit any you don't need (or use `only`/`except`).
 */
export interface ResourceHandlers {
  index?: HandlerType;
  /** Web-only: renders the "create" form. Not included in apiResource(). */
  create?: HandlerType;
  store?: HandlerType;
  show?: HandlerType;
  /** Web-only: renders the "edit" form. Not included in apiResource(). */
  edit?: HandlerType;
  update?: HandlerType;
  destroy?: HandlerType;
}

/** Options for Route.resource() and Route.apiResource(). */
export interface ResourceOptions {
  /** Include only these actions. Mutually exclusive with `except`. */
  only?: ResourceAction[];
  /** Exclude these actions. Mutually exclusive with `only`. */
  except?: ResourceAction[];
  /** Override generated route names. e.g. { index: 'photos.list' } */
  names?: Partial<Record<ResourceAction, string>>;
  /** Middleware applied to every route in the resource. */
  middleware?: MiddlewareInput[];
  /** Render mode for web resource routes (index, create, show, edit). @default 'dynamic' */
  render?: RenderMode;
  /** Model binding definitions for :id segments. */
  bind?: Record<string, BindingDefinition>;
  deprecated?: boolean;
  sunset?: string;
}
