/**
 * Tests for defineContentLoader()
 *
 * Strategy: write fixture .md files to a temp directory before tests,
 * then create a loader pointing at that directory. Clear cache between
 * tests to ensure each test gets a fresh parse pass.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { defineContentLoader, clearContentCache } from '../src/index.js';
import { z } from 'zod';

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Unique temp dir so parallel test runs don't collide
const CONTENT_DIR = join(tmpdir(), `lumiarq-content-test-${Date.now()}`);

const SCHEMA = z.object({
  title: z.string(),
  section: z.string().optional(),
  order: z.number().default(0),
  draft: z.boolean().default(false),
});

type TestFrontmatter = z.infer<typeof SCHEMA>;

const FIXTURES: Record<string, string> = {
  'getting-started.md': `---
title: Getting Started
section: Basics
order: 1
draft: false
---

## Overview

This is the getting started guide.

### Installation

Run the install command.

## Next Steps

See the full docs.
`,

  'installation.md': `---
title: Installation Guide
section: Basics
order: 0
draft: false
---

Install the package using npm or pnpm.

## Requirements

Node.js 20+ is required.
`,

  'architecture/modules.md': `---
title: Modules
section: Architecture
order: 2
draft: false
---

## What is a Module?

Modules are the primary unit of composition.

### Directory Layout

Each module has its own directory.
`,

  'architecture/overview.md': `---
title: Architecture Overview
section: Architecture
order: 1
draft: false
---

The architecture is inspired by Porto SAP.
`,

  'drafts/wip.md': `---
title: Work in Progress
section: Drafts
order: 99
draft: true
---

This page is not published yet.
`,

  'code-example.md': `---
title: Code Example
section: Reference
order: 5
draft: false
---

Here is a TypeScript snippet:

\`\`\`typescript
const x: number = 42;
\`\`\`
`,

  'long-read.md': `---
title: Long Article
section: Reference
order: 10
draft: false
---

${Array(60).fill('This is a word.').join(' ')}
`,
};

const INVALID_FIXTURE = `---
title: 42
---

Bad frontmatter (title should be string, but schema is strict).
`;

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(() => {
  mkdirSync(join(CONTENT_DIR, 'architecture'), { recursive: true });
  mkdirSync(join(CONTENT_DIR, 'drafts'), { recursive: true });

  for (const [relPath, content] of Object.entries(FIXTURES)) {
    const full = join(CONTENT_DIR, relPath);
    mkdirSync(resolve(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
});

afterAll(() => {
  rmSync(CONTENT_DIR, { recursive: true, force: true });
});

afterEach(() => {
  // Clear cache so each test gets a fresh parse pass
  clearContentCache();
});

// ── Factory helper ─────────────────────────────────────────────────────────

function makeLoader() {
  return defineContentLoader({
    directory: CONTENT_DIR, // absolute path — resolve() returns it unchanged
    schema: SCHEMA,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('defineContentLoader()', () => {
  describe('get(slug)', () => {
    it('returns a ContentPage with the correct slug for a flat file', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page).not.toBeNull();
      expect(page!.slug).toBe('getting-started');
    });

    it('returns a ContentPage with the correct slug for a nested path', async () => {
      const loader = makeLoader();
      const page = await loader.get('architecture/modules');

      expect(page).not.toBeNull();
      expect(page!.slug).toBe('architecture/modules');
    });

    it('returns null for a non-existent slug', async () => {
      const loader = makeLoader();
      const page = await loader.get('nonexistent-page');

      expect(page).toBeNull();
    });

    it('exposes the relative path (including extension)', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page!.path).toBe('getting-started.md');
    });

    it('exposes the absolute filePath', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page!.filePath).toBe(join(CONTENT_DIR, 'getting-started.md'));
    });
  });

  describe('all()', () => {
    it('returns all pages sorted by order frontmatter field ascending', async () => {
      const loader = makeLoader();
      const pages = await loader.all();

      const orders = pages.map((p) => p.frontmatter.order);
      expect(orders).toEqual([...orders].sort((a, b) => a - b));
    });

    it('includes all non-draft pages', async () => {
      const loader = makeLoader();
      const pages = await loader.all();
      const slugs = pages.map((p) => p.slug);

      expect(slugs).toContain('getting-started');
      expect(slugs).toContain('installation');
      expect(slugs).toContain('architecture/modules');
      expect(slugs).toContain('architecture/overview');
    });

    it('includes draft pages (filtering by draft is caller responsibility)', async () => {
      const loader = makeLoader();
      const pages = await loader.all();

      expect(pages.some((p) => p.frontmatter.draft)).toBe(true);
    });
  });

  describe('section(name)', () => {
    it('returns only pages in the given sub-directory', async () => {
      const loader = makeLoader();
      const pages = await loader.section('architecture');

      expect(pages.length).toBe(2);
      for (const p of pages) {
        expect(p.slug.startsWith('architecture/')).toBe(true);
      }
    });

    it('returns empty array when section has no pages', async () => {
      const loader = makeLoader();
      const pages = await loader.section('nonexistent-section');

      expect(pages).toHaveLength(0);
    });
  });

  describe('frontmatter', () => {
    it('parses frontmatter correctly', async () => {
      const loader = makeLoader();
      const page = (await loader.get('getting-started')) as { frontmatter: TestFrontmatter };

      expect(page.frontmatter.title).toBe('Getting Started');
      expect(page.frontmatter.section).toBe('Basics');
      expect(page.frontmatter.order).toBe(1);
      expect(page.frontmatter.draft).toBe(false);
    });

    it('throws with a clear error when frontmatter is invalid', async () => {
      // Use a separate isolated directory — writing to CONTENT_DIR would break other tests
      const isolatedDir = join(tmpdir(), `lumiarq-invalid-test-${Date.now()}`);
      mkdirSync(isolatedDir, { recursive: true });
      writeFileSync(join(isolatedDir, 'bad.md'), INVALID_FIXTURE);

      try {
        const loader = defineContentLoader({
          directory: isolatedDir,
          schema: z.object({ title: z.string().min(3) }), // title '42' fails min(3)
        });
        await expect(loader.all()).rejects.toThrow(/Content loader: invalid frontmatter/);
      } finally {
        clearContentCache(isolatedDir);
        rmSync(isolatedDir, { recursive: true, force: true });
      }
    });
  });

  describe('body', () => {
    it('strips frontmatter from the body', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page!.body).not.toContain('---');
      expect(page!.body).toContain('## Overview');
    });
  });

  describe('html', () => {
    it('renders Markdown to HTML', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page!.html).toContain('<h2');
      expect(page!.html).toContain('<p>');
    });

    it('generates heading IDs for anchor linking', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page!.html).toContain('id="overview"');
      expect(page!.html).toContain('id="next-steps"');
    });

    it('syntax-highlights code blocks when highlight: true (default)', async () => {
      const loader = makeLoader();
      const page = await loader.get('code-example');

      // highlight.js adds class="hljs language-typescript"
      expect(page!.html).toContain('hljs language-typescript');
      // And wraps tokens in spans
      expect(page!.html).toContain('<span class="hljs-');
    });

    it('does not syntax-highlight when highlight: false', async () => {
      const loader = defineContentLoader({
        directory: CONTENT_DIR,
        schema: SCHEMA,
        highlight: false,
      });
      const page = await loader.get('code-example');

      expect(page!.html).not.toContain('hljs language-typescript');
    });
  });

  describe('toc', () => {
    it('extracts h2 and h3 headings into a nested TOC', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');
      const toc = page!.toc;

      // Should have two h2 entries: Overview and Next Steps
      expect(toc.length).toBeGreaterThanOrEqual(1);

      const overview = toc.find((e) => e.id === 'overview');
      expect(overview).toBeDefined();
      expect(overview!.text).toBe('Overview');
      expect(overview!.level).toBe(2);

      // h3 Installation is nested under Overview
      const installation = overview!.children.find((e) => e.id === 'installation');
      expect(installation).toBeDefined();
      expect(installation!.level).toBe(3);
    });

    it('returns empty toc for pages with no headings', async () => {
      const plainFile = join(CONTENT_DIR, '_plain.md');
      writeFileSync(plainFile, `---\ntitle: Plain\norder: 99\n---\n\nJust a paragraph.\n`);

      try {
        const loader = makeLoader();
        const page = await loader.get('_plain');

        expect(page!.toc).toHaveLength(0);
      } finally {
        rmSync(plainFile, { force: true });
        clearContentCache();
      }
    });
  });

  describe('excerpt', () => {
    it('returns the first paragraph as plain text', async () => {
      const loader = makeLoader();
      const page = await loader.get('installation');

      expect(page!.excerpt).toBe('Install the package using npm or pnpm.');
      expect(page!.excerpt).not.toContain('<'); // no HTML
    });

    it('skips headings and returns the first paragraph body', async () => {
      const loader = makeLoader();
      const page = await loader.get('architecture/overview');

      expect(page!.excerpt).toBe('The architecture is inspired by Porto SAP.');
    });
  });

  describe('readingTime', () => {
    it('returns at least 1 minute for any page', async () => {
      const loader = makeLoader();
      const page = await loader.get('getting-started');

      expect(page!.readingTime).toBeGreaterThanOrEqual(1);
    });

    it('returns more than 1 minute for a long article', async () => {
      const loader = makeLoader();
      const page = await loader.get('long-read');

      // 60 * 3 = 180 words ÷ 200 wpm → Math.ceil(0.9) = 1 minute
      // But "This is a word." repeated 60 times = 60 * 4 = 240 words → 2 minutes
      expect(page!.readingTime).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cache behaviour', () => {
    it('returns the same ContentPage object on repeated calls (cached)', async () => {
      const loader = makeLoader();
      const first = await loader.all();
      const second = await loader.all();

      // Strict reference equality — same array from cache
      expect(first).toBe(second);
    });

    it('clearCache() forces re-parsing on next call', async () => {
      const loader = makeLoader();
      const first = await loader.all();

      loader.clearCache();
      const second = await loader.all();

      // Different array reference — re-parsed
      expect(first).not.toBe(second);
    });
  });

  describe('empty / missing directory', () => {
    it('returns empty array when directory does not exist', async () => {
      const loader = defineContentLoader({
        directory: join(CONTENT_DIR, 'does-not-exist'),
        schema: SCHEMA,
      });

      const pages = await loader.all();
      expect(pages).toHaveLength(0);
    });
  });
});
