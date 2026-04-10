import { z, type ZodTypeAny } from 'zod';
import type { BoundLoader, SitemapEntry } from './types.js';

export interface LoaderDefinition<TSchema extends ZodTypeAny, TOutput> {
  id?: string;
  schema: TSchema;
  dependsOn?: BoundLoader[];
  fetch(args: { input: z.infer<TSchema>; deps: Map<string, unknown> }): Promise<TOutput>;
}

export function defineLoader<TSchema extends ZodTypeAny, TOutput>(
  definition: LoaderDefinition<TSchema, TOutput>,
): BoundLoader {
  return {
    id: definition.id ?? 'loader',
    dependsOn: definition.dependsOn ?? [],
    fetch: async ({ input, deps }) => {
      const parsed = definition.schema.parse(input) as z.infer<TSchema>;
      return definition.fetch({ input: parsed, deps });
    },
  };
}

export interface SitemapLoaderFn<TDeps = void> {
  (ctx: TDeps extends void ? Record<never, never> : { repos: TDeps }): Promise<SitemapEntry[]>;
}

export function defineSitemapLoader<TDeps = void>(
  fn: SitemapLoaderFn<TDeps>,
): SitemapLoaderFn<TDeps> {
  return fn;
}
