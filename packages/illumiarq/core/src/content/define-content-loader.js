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
import { getCached, setCached, clearCache as clearCacheDir } from './content-cache.js';
import { CONTENT_DEFAULTS } from '../config/defaults.js';
// ── Factory ───────────────────────────────────────────────────────────────────
/**
 * Creates a typed content loader for the given directory.
 * The loader scans `.md` files, parses frontmatter with the provided Zod schema,
 * renders Markdown to HTML, and caches results in memory.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineContentLoader(options) {
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
  function load() {
    const cached = getCached(absDir);
    if (cached) return cached;
    const filePaths = collectFiles(absDir, extensions);
    const pages = filePaths.map((filePath) => parsePage(filePath, absDir, schema, md));
    // Default sort: by `order` frontmatter field ascending, then alphabetically
    pages.sort((a, b) => {
      const orderA = a.frontmatter['order'];
      const orderB = b.frontmatter['order'];
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
    async get(slug) {
      const pages = load();
      return pages.find((p) => p.slug === slug) ?? null;
    },
    async all() {
      return load();
    },
    async section(name) {
      const pages = load();
      // Match pages whose `path` starts with the section directory
      return pages.filter(
        (p) => p.path.startsWith(`${name}/`) || p.path.startsWith(`${name}${sep}`),
      );
    },
    clearCache() {
      clearCacheDir(absDir);
    },
  };
}
// ── Internal helpers ──────────────────────────────────────────────────────────
/** Recursively collect all files with the given extensions under `dir`. */
function collectFiles(dir, extensions) {
  const results = [];
  function walk(current) {
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
function parsePage(
  filePath,
  absDir,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema,
  md,
) {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const body = parsed.content;
  // Validate frontmatter — throws ZodError with file context on mismatch
  let frontmatter;
  try {
    frontmatter = schema.parse(parsed.data);
  } catch (err) {
    const rel = relative(absDir, filePath);
    throw new Error(`Content loader: invalid frontmatter in "${rel}": ${String(err)}`);
  }
  // Relative path from content directory (uses forward slashes for slugs on all platforms)
  const relPath = relative(absDir, filePath).replace(/\\/g, '/');
  const slug = relPath.replace(/\.[^.]+$/, ''); // strip extension
  // Render Markdown → HTML
  const html = md.parse(body);
  const toc = extractToc(html);
  const excerpt = extractExcerpt(body);
  const readingTime = Math.max(
    CONTENT_DEFAULTS.minReadingTimeMinutes,
    Math.ceil(countWords(body) / CONTENT_DEFAULTS.readingSpeedWpm),
  );
  return { slug, path: relPath, frontmatter, body, html, excerpt, readingTime, toc, filePath };
}
/** Build a per-instance Marked renderer with optional syntax highlighting. */
function buildMarked(highlight) {
  const md = new Marked();
  // Add id attributes to headings for TOC anchor linking
  md.use({
    renderer: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      heading({ text, depth }) {
        const id = slugifyHeading(text);
        return `<h${depth} id="${id}">${text}</h${depth}>\n`;
      },
    },
  });
  if (highlight) {
    md.use(
      markedHighlight({
        langPrefix: 'hljs language-',
        highlight(code, lang) {
          const language = hljs.getLanguage(lang) ? lang : 'plaintext';
          return hljs.highlight(code, { language }).value;
        },
      }),
    );
  }
  return md;
}
/** Convert heading text to a URL-safe id, e.g. "Getting Started" → "getting-started". */
function slugifyHeading(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
/** Extract a flat list of h2–h4 headings from HTML and nest them. */
function extractToc(html) {
  const headingRe = /<h([2-4])\s[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  const flat = [];
  let match;
  while ((match = headingRe.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    // Strip any inner HTML tags for plain text
    const text = (match[3] ?? '').replace(/<[^>]+>/g, '').trim();
    flat.push({ id, text, level, children: [] });
  }
  // Nest: h3 → children of preceding h2; h4 → children of preceding h3
  return nestToc(flat);
}
function nestToc(flat) {
  const root = [];
  const stack = [];
  for (const entry of flat) {
    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(entry);
    } else {
      stack[stack.length - 1].children.push(entry);
    }
    stack.push(entry);
  }
  return root;
}
/** Extract the first paragraph as plain text. */
function extractExcerpt(body) {
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
function countWords(text) {
  // Strip code fences, links, inline code, then count whitespace-delimited tokens
  const stripped = text
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // links
  return (stripped.match(/\S+/g) ?? []).length;
}
//# sourceMappingURL=define-content-loader.js.map
