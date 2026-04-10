import { describe, it, expect } from 'vitest';
import { buildSearchIndex } from '../src/indexer/build-index.js';
import { queryIndex } from '../src/query/query-index.js';
import type { SearchableDoc } from '../src/types/search.types.js';

const DOCS: SearchableDoc[] = [
  {
    slug: '/docs/routing',
    title: 'Routing',
    section: 'Core Concepts',
    description: 'Define HTTP routes with the Route DSL.',
  },
  {
    slug: '/docs/middleware',
    title: 'Middleware',
    section: 'Core Concepts',
    description: 'Intercept requests with composable middleware.',
  },
  {
    slug: '/docs/database',
    title: 'Database & ORM',
    section: 'Data Layer',
    description: 'Query your database with Drizzle ORM.',
  },
  {
    slug: '/docs/auth',
    title: 'Authentication',
    section: 'Security',
    description: 'JWT-based authentication and session handling.',
    keywords: ['jwt', 'login', 'register'],
  },
  {
    slug: '/docs/events',
    title: 'Events & EventBus',
    section: 'Advanced',
    description: 'Dispatch and listen to domain events.',
  },
  {
    slug: '/docs/installation',
    title: 'Installation',
    section: 'Getting Started',
    description: 'Install and set up a new LumiARQ project.',
  },
];

describe('buildSearchIndex', () => {
  it('returns pages array and a createdAt timestamp', () => {
    const index = buildSearchIndex(DOCS);
    expect(index.pages).toHaveLength(DOCS.length);
    expect(index.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('preserves all doc fields', () => {
    const index = buildSearchIndex(DOCS);
    expect(index.pages[0]).toMatchObject({ slug: '/docs/routing', title: 'Routing' });
  });
});

describe('queryIndex', () => {
  const index = buildSearchIndex(DOCS);

  it('returns empty array for empty or whitespace query', () => {
    expect(queryIndex(index, '')).toEqual([]);
    expect(queryIndex(index, '   ')).toEqual([]);
  });

  it('finds an exact title word match', () => {
    const results = queryIndex(index, 'routing');
    expect(results[0]?.slug).toBe('/docs/routing');
    expect(results[0]?.score).toBeGreaterThanOrEqual(10);
  });

  it('finds a partial title match', () => {
    const results = queryIndex(index, 'instal');
    expect(results[0]?.slug).toBe('/docs/installation');
  });

  it('finds via keyword', () => {
    const results = queryIndex(index, 'jwt');
    expect(results[0]?.slug).toBe('/docs/auth');
  });

  it('finds via section', () => {
    const results = queryIndex(index, 'Security');
    expect(results[0]?.slug).toBe('/docs/auth');
  });

  it('finds via description', () => {
    const results = queryIndex(index, 'Drizzle');
    expect(results[0]?.slug).toBe('/docs/database');
  });

  it('excludes documents with zero score', () => {
    const results = queryIndex(index, 'xyzzy_no_match');
    expect(results).toHaveLength(0);
  });

  it('respects limit option', () => {
    // build a large index
    const many: SearchableDoc[] = Array.from({ length: 20 }, (_, i) => ({
      slug: `/docs/page-${i}`,
      title: `Page ${i} routing guide`,
      section: 'Core',
      description: 'routing details',
    }));
    const bigIndex = buildSearchIndex(many);
    const results = queryIndex(bigIndex, 'routing', { limit: 3 });
    expect(results).toHaveLength(3);
  });

  it('sorts results by score descending', () => {
    const results = queryIndex(index, 'database');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]?.score ?? 0).toBeGreaterThanOrEqual(results[i]?.score ?? 0);
    }
  });

  it('result shape includes all required fields', () => {
    const results = queryIndex(index, 'routing');
    expect(results[0]).toHaveProperty('slug');
    expect(results[0]).toHaveProperty('title');
    expect(results[0]).toHaveProperty('section');
    expect(results[0]).toHaveProperty('description');
    expect(results[0]).toHaveProperty('score');
  });
});
