export interface BoundLoader {
  id: string;
  dependsOn?: BoundLoader[];
  fetch(args: { input: unknown; deps: Map<string, unknown> }): Promise<unknown>;
}

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  priority?: number;
}
