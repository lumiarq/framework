import stringify from 'fast-json-stable-stringify';
import type { BoundLoader } from './types.js';
import { LoaderDependencyError } from '@velo/core';

export interface RequestCache {
  get(key: string): Promise<unknown> | undefined;
  set(key: string, p: Promise<unknown>): void;
}

export function createRequestCache(): RequestCache {
  const store = new Map<string, Promise<unknown>>();
  return {
    get: (key) => store.get(key),
    set: (key, p) => {
      store.set(key, p);
    },
  };
}

function detectCyclesDFS(
  loader: BoundLoader,
  visiting: Set<string>,
  visited: Set<string>,
  path: string[],
): void {
  if (visited.has(loader.id)) return;

  if (visiting.has(loader.id)) {
    const cycle = [...path, loader.id].join(' → ');
    throw new LoaderDependencyError(cycle);
  }

  visiting.add(loader.id);
  path.push(loader.id);

  for (const dep of loader.dependsOn ?? []) {
    detectCyclesDFS(dep, visiting, visited, path);
  }

  path.pop();
  visiting.delete(loader.id);
  visited.add(loader.id);
}

function assertAcyclic(loaders: BoundLoader[]): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  for (const loader of loaders) {
    detectCyclesDFS(loader, visiting, visited, []);
  }
}

export async function orchestrateLoaders(
  loaders: BoundLoader[],
  input: Record<string, unknown>,
  cache: RequestCache,
): Promise<Map<string, unknown>> {
  assertAcyclic(loaders);

  const results = new Map<string, unknown>();

  async function runLoader(loader: BoundLoader): Promise<unknown> {
    const key = `${loader.id}:${stringify(input[loader.id] ?? {})}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const promise = (async () => {
      const deps = new Map<string, unknown>();
      await Promise.all(
        (loader.dependsOn ?? []).map(async (dep) => {
          deps.set(dep.id, await runLoader(dep));
        }),
      );
      return loader.fetch({ input: input[loader.id], deps });
    })();

    cache.set(key, promise);
    return promise;
  }

  await Promise.all(
    loaders.map(async (loader) => {
      results.set(loader.id, await runLoader(loader));
    }),
  );

  return results;
}
