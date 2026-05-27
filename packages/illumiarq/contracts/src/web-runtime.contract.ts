export type RevalidatePolicy =
  | { mode: 'static' }
  | { mode: 'timeWindow'; seconds: number }
  | { mode: 'always' };

export interface RenderRequest<TParams extends Record<string, string> = Record<string, string>> {
  url: string;
  method: string;
  params: TParams;
  headers: Record<string, string>;
  searchParams: Record<string, string | string[]>;
}

export interface PageLoadContext<TParams extends Record<string, string> = Record<string, string>> {
  request: RenderRequest<TParams>;
}

export interface ActionResult<TData = unknown> {
  data?: TData;
  redirectTo?: string;
  status?: number;
}

export interface PageMeta {
  title?: string;
  description?: string;
  canonicalUrl?: string;
}

export interface RenderPayload<TData = unknown> {
  initialData: TData;
  meta?: PageMeta;
  revalidate?: RevalidatePolicy;
  pageVersion: string;
}

export interface RenderResult<TData = unknown> {
  html: string;
  payload: RenderPayload<TData>;
  status: number;
  headers?: Record<string, string>;
}

export interface PageModule<
  TData = unknown,
  TParams extends Record<string, string> = Record<string, string>,
> {
  loader?: (context: PageLoadContext<TParams>) => Promise<TData>;
  action?: (context: PageLoadContext<TParams>) => Promise<ActionResult<TData>>;
  meta?: (context: { data: TData; request: RenderRequest<TParams> }) => PageMeta;
  render: (context: {
    data: TData;
    request: RenderRequest<TParams>;
  }) => Promise<RenderResult<TData>>;
}
