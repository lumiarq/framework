/**
 * defineContentLoader — Scans a directory of .md files at build/import time,
 * parses frontmatter, renders Markdown → HTML, and returns typed pages.
 *
 * Results are cached in memory after the first call so multiple Loaders
 * that use the same content directory pay the parsing cost only once.
 *
 * @example
 * ```ts
 * export const docsContent = defineContentLoader({
 *   directory: 'content/docs',
 *   schema: z.object({
 *     title:   z.string(),
 *     section: z.string().optional(),
 *     order:   z.number().default(0),
 *     draft:   z.boolean().default(false),
 *   }),
 * });
 * ```
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve, relative, sep } from 'node:path';
import matter from 'gray-matter';
import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { z } from 'zod';
import { getCached, setCached, clearCache as clearCacheDir } from './content-cache.js';
import { CONTENT_DEFAULTS } from '../config/defaults.js';

// ── Public types ─────────────────────────────────────────────────────────────

/** A single parsed, rendered documentation page. */
export interface ContentPage<TFrontmatter> {
  /** Slug derived from filename: `getting-started.md` → `getting-started`. Nested paths: `architecture/modules.md` → `architecture/modules`. */
  slug: string;
  /** Relative path from the content directory, e.g. `architecture/modules.md`. */
  path: string;
  /** Validated frontmatter. */
  frontmatter: TFrontmatter;
  /** Raw Markdown body with frontmatter stripped. */
  body: string;
  /** Rendered HTML (Markdown → HTML, code blocks syntax-highlighted). */
  html: string;
  /** First paragraph as plain text (no HTML). */
  excerpt: string;
  /** Estimated reading time in minutes (word count ÷ CONTENT_DEFAULTS.readingSpeedWpm, min CONTENT_DEFAULTS.minReadingTimeMinutes). */
  readingTime: number;
  /** Nested table of contents extracted from h2–h4 headings. */
  toc: TocEntry[];
  /** Absolute filesystem path to the source `.md` file. */
  filePath: string;
}

/** A single entry in the table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  level: 1 | 2 | 3 | 4;
  children: TocEntry[];
}

/** Options passed to `defineContentLoader()`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ContentLoaderOptions<TSchema extends z.ZodObject<any>> {
  /** Path to the content directory, relative to `process.cwd()`. Example: `'content/docs'`. */
  directory: string;
  /** Zod schema for frontmatter validation. Invalid files throw at parse time. */
  schema: TSchema;
  /** File extensions to include. Default: `['.md']`. MDX reserved for v2. */
  extensions?: string[];
  /** Enable syntax highlighting in fenced code blocks. Default: `true`. */
  highlight?: boolean;
}

/** The ContentLoader API returned by `defineContentLoader()`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ContentLoader<TFrontmatter> {
  /** Get a single page by slug. Returns `null` if not found. */
  get(slug: string): Promise<ContentPage<TFrontmatter> | null>;
  /** Get all pages, sorted by `order` frontmatter field ascending. */
  all(): Promise<ContentPage<TFrontmatter>[]>;
  /** Get all pages whose filepath starts with the given sub-directory name. */
  section(name: string): Promise<ContentPage<TFrontmatter>[]>;
  /** Clear the in-memory cache for this content directory (useful in tests). */
  clearCache(): void;
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Creates a typed content loader for the given directory.
 * The loader scans `.md` files, parses frontmatter with the provided Zod schema,
 * renders Markdown to HTML, and caches results in memory.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineContentLoader<TSchema extends z.ZodObject<any>>(
  options: ContentLoaderOptions<TSchema>,
): ContentLoader<z.infer<TSchema>> {
  type FM = z.infer<TSchema>;

  const {
    schema,
    extensions = [...CONTENT_DEFAULTS.extensions],
    highlight = CONTENT_DEFAULTS.highlight,
  } = options;

  // Resolve directory once — relative to cwd at call time
  const absDir = resolve(process.cwd(), options.directory);

  // Per-instance Marked renderer — avoids polluting the global marked instance
  const md = buildMarked(highlight);

  // ── Internal: load + parse all files ───────────────────────────────────────

  function load(): ContentPage<FM>[] {
    const cached = getCached<ContentPage<FM>>(absDir);
    if (cached) return cached;

    const filePaths = collectFiles(absDir, extensions);
    const pages = filePaths.map((filePath) => parsePage<FM>(filePath, absDir, schema, md));

    // Default sort: by `order` frontmatter field ascending, then alphabetically
    pages.sort((a, b) => {
      const orderA = (a.frontmatter as Record<string, unknown>)['order'];
      const orderB = (b.frontmatter as Record<string, unknown>)['order'];
      const aNum = typeof orderA === 'number' ? orderA : 0;
      const bNum = typeof orderB === 'number' ? orderB : 0;
      if (aNum !== bNum) return aNum - bNum;
      return a.slug.localeCompare(b.slug);
    });

    setCached(absDir, pages);
    return pages;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  return {
    async get(slug: string): Promise<ContentPage<FM> | null> {
      const pages = load();
      return pages.find((p) => p.slug === slug) ?? null;
    },

    async all(): Promise<ContentPage<FM>[]> {
      return load();
    },

    async section(name: string): Promise<ContentPage<FM>[]> {
      const pages = load();
      // Match pages whose `path` starts with the section directory
      return pages.filter(
        (p) => p.path.startsWith(`${name}/`) || p.path.startsWith(`${name}${sep}`),
      );
    },

    clearCache(): void {
      clearCacheDir(absDir);
    },
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Recursively collect all files with the given extensions under `dir`. */
function collectFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];

  function walk(current: string): void {
    const entries = readdirSync(current);
    for (const entry of entries) {
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (extensions.includes(extname(full))) {
        results.push(full);
      }
    }
  }

  try {
    walk(dir);
  } catch {
    // Directory does not exist yet — return empty array (graceful during build setup)
  }

  return results.sort(); // stable ordering
}

/** Parse a single Markdown file into a `ContentPage`. */
function parsePage<TFrontmatter>(
  filePath: string,
  absDir: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodObject<any>,
  md: Marked,
): ContentPage<TFrontmatter> {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const body = parsed.content;

  // Validate frontmatter — throws ZodError with file context on mismatch
  let frontmatter: TFrontmatter;
  try {
    frontmatter = schema.parse(parsed.data) as TFrontmatter;
  } catch (err) {
    const rel = relative(absDir, filePath);
    throw new Error(`Content loader: invalid frontmatter in "${rel}": ${String(err)}`);
  }

  // Relative path from content directory (uses forward slashes for slugs on all platforms)
  const relPath = relative(absDir, filePath).replace(/\\/g, '/');
  const slug = relPath.replace(/\.[^.]+$/, ''); // strip extension

  // Render Markdown → HTML
  const html = md.parse(body) as string;
  const toc = extractToc(html);
  const excerpt = extractExcerpt(body);
  const readingTime = Math.max(
    CONTENT_DEFAULTS.minReadingTimeMinutes,
    Math.ceil(countWords(body) / CONTENT_DEFAULTS.readingSpeedWpm),
  );

  return { slug, path: relPath, frontmatter, body, html, excerpt, readingTime, toc, filePath };
}

/** Build a per-instance Marked renderer with optional syntax highlighting. */
function buildMarked(highlight: boolean): Marked {
  const md = new Marked();

  // Add id attributes to headings for TOC anchor linking
  md.use({
    renderer: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      heading({ text, depth }: { text: string; depth: number; [key: string]: any }): string {
        const id = slugifyHeading(text);
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
    },
  });

  if (highlight) {
    md.use(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code: string, lang: string): string {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        },
      }),
    );
  }

  return md;
}

/** Convert heading text to a URL-safe id, e.g. "Getting Started" → "getting-started". */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Extract a flat list of h2–h4 headings from HTML and nest them. */
function extractToc(html: string): TocEntry[] {
  const headingRe = /<h([2-4])\s[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  const flat: TocEntry[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRe.exec(html)) !== null) {
    const level = parseInt(match[1]!, 10) as 1 | 2 | 3 | 4;
    const id = match[2]!;
    // Strip any inner HTML tags for plain text
    const text = (match[3] ?? '').replace(/<[^>]+>/g, '').trim();
    flat.push({ id, text, level, children: [] });
  }

  // Nest: h3 → children of preceding h2; h4 → children of preceding h3
  return nestToc(flat);
}

function nestToc(flat: TocEntry[]): TocEntry[] {
  const root: TocEntry[] = [];
  const stack: TocEntry[] = [];

  for (const entry of flat) {
    while (stack.length > 0 && stack[stack.length - 1]!.level >= entry.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(entry);
    } else {
      stack[stack.length - 1]!.children.push(entry);
    }
    stack.push(entry);
  }

  return root;
}

/** Extract the first paragraph as plain text. */
function extractExcerpt(body: string): string {
  // Split into paragraphs on double newlines, take first non-empty one
  const paragraphs = body.split(/\n{2,}/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    // Skip headings, code fences, blank lines
    if (
      trimmed &&
      !trimmed.startsWith('#') &&
      !trimmed.startsWith('```') &&
      !trimmed.startsWith('---')
    ) {
      // Strip any inline markdown (emphasis, links, code spans)
      return trimmed
        .replace(/!\[.*?\]\(.*?\)/g, '') // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links → text
        .replace(/`[^`]*`/g, '$1') // inline code
        .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // bold/italic
        .replace(/\s+/g, ' ')
        .trim();
    }
  }
  return '';
}

/** Count words in a Markdown body for reading-time estimation. */
function countWords(text: string): number {
  // Strip code fences, links, inline code, then count whitespace-delimited tokens
  const stripped = text
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // links
  return (stripped.match(/\S+/g) ?? []).length;
}
