/**
 * lumis view:cache — Compiles HTML templates into cached TypeScript render functions.
 *
 * Template syntax (EJS-compatible subset):
 *   @import type { Foo } from 'bar'   — pass-through TypeScript import (typed vars only)
 *   @vars({ a: TypeA, b: string })    — typed render function (generates RenderVars interface)
 *   @vars({ a, b, c })               — untyped render function (falls back to Record<string,any>)
 *   @extends('layouts/base')         — layout inheritance (compile-time merge)
 *   @include('partials/nav')         — inlines a partial template file at compile time
 *   @section('name') ... @endsection — child section content (used with @extends)
 *   @yield('name')                   — section placeholder in a layout template
 *   @t('key')                        — runtime translation key resolved via locale map
 *   @styles('file.css')              — inlines the CSS file at compile time
 *   @scripts('file.js')              — inlines the JS file at compile time
 *   <%= expr %>                      — HTML-escaped output
 *   <%- expr %>                      — raw HTML output
 *   <% stmt %>                       — TypeScript/JS statement (if, for, etc.)
 *
 * Layout resolution (for @extends) — first match wins:
 *   1. Module-local (nested):  src/modules/<Name>/ui/web/templates/layouts/<path>.{html|veil.html}
 *   2. Module-local (sibling): src/modules/<Name>/ui/web/layouts/<path>.{html|veil.html}
 *   3. Shared module (full):   src/modules/Shared/ui/web/templates/<path>.{html|veil.html}
 *   4. Shared module (simple): src/modules/Shared/<path>.{html|veil.html}
 *   5. App-level shared:       src/shared/ui/<path>.{html|veil.html}
 *
 * Asset resolution (for @styles / @scripts) — first match wins:
 *   1. Module-local (nested):  src/modules/<Name>/ui/web/assets/<file>
 *   2. Module-local (flat):    src/modules/<Name>/ui/assets/<file>
 *   3. Shared module (full):   src/modules/Shared/ui/web/assets/<file>
 *   4. Shared module (simple): src/modules/Shared/assets/<file>
 *   5. App-level shared:       src/shared/ui/assets/<file>
 *
 * Conventions (any of these three layouts structures work):
 *   Per-module:      src/modules/<Name>/ui/web/layouts/       → module-scoped layouts
 *   Shared module:   src/modules/Shared/layouts/               → shared across modules
 *   App-level:       src/shared/ui/layouts/                    → app-wide shared
 *   --- assets follow the same 3-tier pattern ---
 *   Per-module:      src/modules/<Name>/ui/web/assets/
 *   Shared module:   src/modules/Shared/assets/
 *   App-level:       src/shared/ui/assets/
 *
 * Auto-run on: lumis serve, lumis preview, lumis build
 * Options:
 *   --min   Minify the compiled HTML output (whitespace + comment stripping)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { resolve, join, basename, dirname } from 'node:path';
// Path constants inlined from @lumiarq/lumis paths.ts
const APP_PATHS = {
  modulesDir: 'src/modules',
  viewsCache: 'storage/framework/cache/views',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ViewCacheResult {
  compiled: number;
  paths: string[];
}

export interface ViewClearResult {
  cleared: boolean;
  dir: string;
}

/** Options for the viewCache compiler pass. */
export interface ViewCacheOptions {
  /**
   * When true, strips HTML comments and collapses whitespace between tags
   * in the compiled output. <style> and <script> blocks are preserved as-is.
   * Activate with: lumis view:cache --min
   */
  minify?: boolean;
}

// Parsed entry from @vars({ name: Type, ... })
interface VarsEntry {
  name: string;
  type?: string; // undefined means no type annotation was given
}

/** Internal context passed through the compile pipeline. */
interface CompileContext {
  /** Ordered list of module-local asset directories to check (first match wins). */
  assetDirs: string[];
  /** Ordered list of fallback asset directories (first match wins). */
  sharedAssetDirs?: string[];
  templatesDir: string;
  /** Ordered list of fallback template directories (first match wins). */
  sharedTemplatesDirs?: string[];
  minify?: boolean;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Escapes a raw string for safe use inside a TypeScript template literal. */
function escLit(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

/**
 * Minimal HTML minifier used when `--min` flag is active.
 * Protects <style>, <script>, and EJS <% %> blocks from modification,
 * then strips HTML comments and collapses inter-tag whitespace.
 */
function minifyCss(css: string): string {
  let result = css.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\s*([{};:,>+~])\s*/g, '$1');
  result = result.replace(/;}/g, '}');
  return result.trim();
}

function minifyJs(js: string): string {
  let result = js.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip // line comments (skip URLs like http://)
  result = result.replace(/(?<![:/])\/\/[^\n]*/g, '');
  result = result.replace(/\n\s*\n/g, '\n');
  result = result.replace(/^\s+/gm, '');
  return result.trim();
}

function minifyHtml(html: string): string {
  const blocks: string[] = [];
  const placeholder = '\x00B';

  // Protect <style>/<script> blocks and EJS tags.
  // Inline <style> and <script> (without src=) have their content minified.
  let result = html.replace(
    /<(style|script)([\s\S]*?)>([\s\S]*?)<\/\1>|<%[\s\S]*?%>/gi,
    (match, tag?: string, attrs?: string, content?: string) => {
      let processed = match;
      if (tag) {
        const t = tag.toLowerCase();
        if (t === 'style' && content !== undefined) {
          processed = `<style${attrs}>` + minifyCss(content) + '</style>';
        } else if (t === 'script' && content !== undefined && attrs !== undefined && !/src\s*=/i.test(attrs)) {
          processed = `<script${attrs}>` + minifyJs(content) + '</script>';
        }
      }
      blocks.push(processed);
      return `${placeholder}${blocks.length - 1}\x00`;
    },
  );

  // Remove HTML comments (preserve IE conditional comments: <!--[if ...)
  result = result.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');

  // Collapse whitespace between tags
  result = result.replace(/>\s+</g, '><');

  // Collapse runs of whitespace (tabs, newlines, multiple spaces) to single space
  result = result.replace(/\s{2,}/g, ' ');

  // Trim leading/trailing whitespace
  result = result.trim();

  // Restore protected blocks
  result = result.replace(new RegExp(`${placeholder}(\\d+)\x00`, 'g'), (_, i: string) => blocks[Number(i)] ?? '');

  return result;
}

/**
 * Parses the content of @vars({ ... }) into an array of VarsEntry objects.
 * Handles both `{ a, b, c }` (no types) and `{ a: TypeA, b: string }` (typed).
 * Does NOT handle nested object types — use named type aliases for complex types.
 */
function parseVars(raw: string): VarsEntry[] {
  // Strip outer braces
  const inner = raw.replace(/^\s*\{|\}\s*$/g, '').trim();
  if (!inner) return [];

  const entries: VarsEntry[] = [];
  // Split by top-level commas (simple — no nested generics or objects)
  for (const part of inner.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx !== -1) {
      entries.push({
        name: trimmed.slice(0, colonIdx).trim(),
        type: trimmed.slice(colonIdx + 1).trim(),
      });
    } else {
      entries.push({ name: trimmed });
    }
  }
  return entries;
}

// ── Layout resolution ─────────────────────────────────────────────────────────

/**
 * Resolves an asset file path: module-local first, then each shared dir in order.
 */
function resolveAsset(file: string, assetDirs: string[], sharedAssetDirs?: string[]): string | null {
  for (const dir of assetDirs) {
    const local = join(dir, file.trim());
    if (existsSync(local)) return local;
  }
  if (sharedAssetDirs) {
    for (const dir of sharedAssetDirs) {
      const candidate = join(dir, file.trim());
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

/**
 * If the template uses @extends('path'), resolves and merges the child sections
 * into the parent layout at compile time. Returns the merged template string with:
 *   - @extends removed
 *   - @section / @endsection blocks removed
 *   - @yield('name') in the parent replaced with the corresponding section content
 *   - Child @vars preserved (placed at the top of the merged output)
 *   - Child @import lines preserved (placed at the top, before @vars)
 *
 * Layout resolution order (first match wins):
 *   1. Module-local in templates/: {templatesDir}/{path}.{html|veil.html}
 *   2. Module-local sibling layouts/: dirname({templatesDir})/{path}.{html|veil.html}
 *   3. Each dir in sharedTemplatesDirs, in order (both .html and .veil.html)
 *
 * Layouts are never compiled as standalone views.
 */
// Tries <base>.html then <base>.veil.html, returns first that exists.
function tryExtensions(base: string): string | null {
  for (const ext of ['.html', '.veil.html']) {
    const p = base + ext;
    if (existsSync(p)) return p;
  }
  return null;
}
function resolveExtends(
  template: string,
  templatesDir: string,
  sharedTemplatesDirs?: string[],
): string {
  const extendsRe = /^@extends\('([^']+)'\)[ \t]*\r?\n?/m;
  const extendsMatch = extendsRe.exec(template);
  if (!extendsMatch) return template;

  const layoutName = extendsMatch[1]!; // capture group always non-empty (regex requires +)

  // Resolution order: module-local (templates/ subdir) → module-local sibling (layouts/) → shared dirs.
  // Each step tries .html first, then .veil.html.
  let layoutPath: string | null =
    tryExtensions(join(templatesDir, layoutName)) ??
    tryExtensions(join(dirname(templatesDir), layoutName));

  if (!layoutPath && sharedTemplatesDirs) {
    for (const dir of sharedTemplatesDirs) {
      const candidate = tryExtensions(join(dir, layoutName));
      if (candidate) { layoutPath = candidate; break; }
    }
  }

  if (!layoutPath) {
    console.warn(`  view:cache: @extends layout not found: ${layoutName}`);
    return template.replace(extendsMatch[0], '');
  }

  // 1. Strip @extends from child
  let child = template.replace(extendsMatch[0], '');

  // 2. Extract @vars from child (re-inject at top of merged output)
  let childVarsLine = '';
  child = child.replace(/^@vars\([^)]+\)[ \t]*\r?\n?/m, (match) => {
    childVarsLine = match.trimEnd() + '\n';
    return '';
  });

  // 3. Extract @import lines from child (re-inject before @vars)
  // Handles both `@import { Foo } from 'bar'` (single-line) and
  // the legacy split form `@import\n{ Foo } from 'bar'` (two-line).
  const importLines: string[] = [];
  child = child.replace(/^@import([^\n]*)\n?(?:([^\n@][^\n]*)\n?)?/gm, (match, inline: string, continuation: string | undefined) => {
    const stmt = inline.trim() ? `@import ${inline.trim()}` : continuation ? `@import ${continuation.trim()}` : '@import';
    if (stmt !== '@import') importLines.push(stmt);
    return '';
  });

  // 4. Collect @section('name') ... @endsection blocks from child
  const sections: Record<string, string> = {};
  const sectionRe = /@section\('([^']+)'\)([\s\S]*?)@endsection/g;
  let sm: RegExpExecArray | null;
  while ((sm = sectionRe.exec(child)) !== null) {
    const sectionName = sm[1];
    const sectionContent = sm[2];
    if (sectionName !== undefined && sectionContent !== undefined) {
      sections[sectionName] = sectionContent;
    }
  }

  // 5. Load layout; strip its own @vars, @import, and any @extends declaration
  let layout = readFileSync(layoutPath, 'utf8');
  layout = layout.replace(/^@vars\([^)]+\)[ \t]*\r?\n?/m, '');
  // Strip @import lines — handles both single-line and legacy split (two-line) form.
  layout = layout.replace(/^@import([^\n]*)\n?(?:([^\n@][^\n]*)\n?)?/gm, '');
  layout = layout.replace(/^@extends\('[^']+'\)[ \t]*\r?\n?/m, '');

  // 6. Replace @yield('name') in layout with section content
  layout = layout.replace(/@yield\('([^']+)'\)/g, (_, name: string) => {
    return (sections[name] ?? '').trim();
  });

  // 7. Reassemble: imports + child @vars + merged layout content
  const importBlock = importLines.length > 0 ? importLines.join('\n') + '\n' : '';
  return importBlock + childVarsLine + layout;
}

function resolveIncludes(
  template: string,
  templatesDir: string,
  sharedTemplatesDirs?: string[],
): string {
  return template.replace(/@include\('([^']+)'\)/g, (match, includePath: string) => {
    let resolved: string | null =
      tryExtensions(join(templatesDir, includePath)) ??
      tryExtensions(join(dirname(templatesDir), includePath));

    if (!resolved && sharedTemplatesDirs) {
      for (const dir of sharedTemplatesDirs) {
        const candidate = tryExtensions(join(dir, includePath));
        if (candidate) { resolved = candidate; break; }
      }
    }

    if (!resolved) {
      console.warn(`  view:cache: @include not found: ${includePath}`);
      return `<!-- view:cache: include '${includePath}' not found -->`;
    }
    return readFileSync(resolved, 'utf8');
  });
}

// ── EJS-style template compiler ──────────────────────────────────────────────

/**
 * Compiles a single `.html` template into a TypeScript render-function module.
 *
 * @param template  Raw template source string
 * @param ctx       Compile context: asset dirs, templates dir, options
 * @param lang      Optional lang map for @t() substitution hint (runtime-resolved)
 */
export function compileTemplate(
  template: string,
  ctx: CompileContext,
  lang: Record<string, string> = {},
): string {
  const { assetDirs, sharedAssetDirs, templatesDir, sharedTemplatesDirs, minify = false } = ctx;

  // ── -1. Inline @include partials (before layout inheritance) ──────────────
  template = resolveIncludes(template, templatesDir, sharedTemplatesDirs);

  // ── 0. Layout inheritance ───────────────────────────────────────
  template = resolveExtends(template, templatesDir, sharedTemplatesDirs);

  // ── 1. Extract pass-through @import lines ────────────────────────────────
  // Handles both `@import { Foo } from 'bar'` (single-line) and
  // legacy split form `@import\n{ Foo } from 'bar'` (two-line).
  const importLines: string[] = [];
  template = template.replace(/^@import([^\n]*)\n?(?:([^\n@][^\n]*)\n?)?/gm, (_, inline: string, continuation: string | undefined) => {
    const rest = inline.trim() || continuation?.trim() || '';
    if (rest) importLines.push(`import ${rest}`);
    return '';
  });

  // ── 2. Extract @vars declaration ─────────────────────────────────────────
  let varsEntries: VarsEntry[] = [];
  template = template.replace(/^@vars\((\{[^)]+\})\)[ \t]*\r?\n?/m, (_, raw: string) => {
    varsEntries = parseVars(raw);
    return '';
  });

  const hasTypes = varsEntries.length > 0 && varsEntries.every((v) => v.type !== undefined);
  const destructure =
    varsEntries.length > 0 ? `{ ${varsEntries.map((v) => v.name).join(', ')} }` : '{}';

  // ── 3. @t('key') — runtime interpolation (v1.0.0+) ──────────────────────
  // @t('key') directives are NOT substituted at compile time.
  // pushLit (step 5) splits literals around them and emits ${__t('key')} expressions.
  // The compiled render function defines __t at runtime using the locale map passed in.

  // ── 4. Inline @styles / @scripts ─────────────────────────────────────────
  template = template.replace(/@styles\('([^']+)'\)/g, (_, file: string) => {
    const p = resolveAsset(file, assetDirs, sharedAssetDirs);
    if (!p) return `<!-- view:cache: styles '${file}' not found -->`;
    return `<style>\n${readFileSync(p, 'utf8')}\n</style>`;
  });

  template = template.replace(/@scripts\('([^']+)'\)/g, (_, file: string) => {
    const p = resolveAsset(file, assetDirs, sharedAssetDirs);
    if (!p) return `<!-- view:cache: scripts '${file}' not found -->`;
    return `<script>\n${readFileSync(p, 'utf8')}\n</script>`;
  });

  // ── 4b. Optional HTML minification ────────────────────────────────────────────
  if (minify) template = minifyHtml(template);

  // ── 5. Compile EJS tags into statement list ───────────────────────────────
  const stmts: string[] = [];
  const TAG_RE = /<%(-|=)?([\s\S]*?)%>/g;
  let cursor = 0;
  let m: RegExpExecArray | null;

  // TRANS_RE matches @t('key') directives inside literal HTML text.
  // Split them out so they become ${__t('key')} expressions (not escaped by escLit).
  const TRANS_RE = /@t\('([^']+)'\)/g;

  const pushLit = (s: string): void => {
    if (!s) return;
    const parts: string[] = [];
    let last = 0;
    let tm: RegExpExecArray | null;
    TRANS_RE.lastIndex = 0;
    while ((tm = TRANS_RE.exec(s)) !== null) {
      parts.push(escLit(s.slice(last, tm.index)));
      parts.push(`\${__t('${tm[1]}')}`);
      last = tm.index + tm[0].length;
    }
    parts.push(escLit(s.slice(last)));
    const combined = parts.join('');
    if (combined) stmts.push(`  __o += \`${combined}\``);
  };

  while ((m = TAG_RE.exec(template)) !== null) {
    pushLit(template.slice(cursor, m.index));

    const flag = m[1] ?? '';
    const expr = (m[2] ?? '').trim();

    if (flag === '-') {
      stmts.push(`  __o += String(${expr} ?? '')`);
    } else if (flag === '=') {
      stmts.push(`  __o += __e(${expr})`);
    } else {
      stmts.push(`  ${expr}`);
    }

    cursor = m.index + m[0].length;
  }

  pushLit(template.slice(cursor));

  // ── 6. Assemble TypeScript module ─────────────────────────────────────────
  const lines: string[] = [
    `// Auto-generated by \`lumis view:cache\` — do not edit.`,
    `// Re-run: lumis view:cache`,
    ``,
  ];

  // Pass-through imports (e.g. import type { DocsPageData } from '...')
  if (importLines.length) {
    lines.push(...importLines, ``);
  }

  if (hasTypes) {
    // Typed path: emit RenderVars interface + typed function signature
    lines.push(`export interface RenderVars {`);
    for (const v of varsEntries) {
      lines.push(`  ${v.name}: ${v.type}`);
    }
    lines.push(`}`, ``);
    lines.push(
      `export function render(vars: RenderVars, locale: Record<string, string> = {}): string {`,
    );
  } else {
    // Untyped path: plain Record<string, any> (backward-compatible)
    lines.push(`// eslint-disable-next-line @typescript-eslint/no-explicit-any`);
    lines.push(
      `export function render(vars: Record<string, any>, locale: Record<string, string> = {}): string {`,
    );
  }

  // Escaper (inside function — defined once per call, not per module to keep scope clean)
  lines.push(
    `  // eslint-disable-next-line @typescript-eslint/no-explicit-any`,
    `  const __e = (v: unknown): string =>`,
    `    String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')`,
    `  const __t = (key: string): string => locale[key] ?? key`,
  );

  if (varsEntries.length) {
    lines.push(`  // eslint-disable-next-line @typescript-eslint/no-unused-vars`);
    lines.push(`  const ${destructure} = vars`);
  }

  lines.push(`  let __o = ''`);
  lines.push(...stmts);
  lines.push(`  return __o`);
  lines.push(`}`);

  return lines.join('\n');
}

// ── Public API ────────────────────────────────────────────────────────────────

// Compiles all HTML templates found under src/modules/{name}/ui/web/templates/
// into TypeScript render functions in storage/framework/cache/views/.
// Files inside layouts/ subdirectories are skipped (they are partials, not standalone pages).
// The `Shared` module is skipped (its templates are layouts only, not standalone views).
// Safe to call repeatedly (idempotent — overwrites existing cached files).
//
// Layout + asset resolution — first match wins across all candidate dirs:
//   1. Module-local  →  src/modules/<Name>/ui/web/templates/ (or assets/)
//   2. Shared module (full path)  →  src/modules/Shared/ui/web/templates/ (or assets/)
//   3. Shared module (simplified) →  src/modules/Shared/ (layouts at Shared/layouts/)
//   4. App-level shared           →  src/shared/ui/ (layouts at src/shared/ui/layouts/)
export async function viewCache(
  cwd = process.cwd(),
  options: ViewCacheOptions = {},
): Promise<ViewCacheResult> {
  const modulesDir = resolve(cwd, APP_PATHS.modulesDir);
  if (!existsSync(modulesDir)) return { compiled: 0, paths: [] };

  // Candidate shared template dir ROOTS — @extends('layouts/x') resolves to {root}/layouts/x.html.
  // Each is an ordered fallback; first match wins.
  const candidateTemplateDirs = [
    join(modulesDir, 'Shared', 'ui', 'web', 'templates'), // 1. full:    Shared/ui/web/templates/layouts/x.html
    join(modulesDir, 'Shared'),                            // 2. simple:  Shared/layouts/x.html
    join(cwd, 'src', 'shared', 'ui'),                     // 3. app-lvl: src/shared/ui/layouts/x.html
  ];
  // Candidate shared asset dirs — @styles('x.css') resolves to {dir}/x.css.
  const candidateAssetDirs = [
    join(modulesDir, 'Shared', 'ui', 'web', 'assets'),    // 1. full:    Shared/ui/web/assets/x.css
    join(modulesDir, 'Shared', 'assets'),                  // 2. simple:  Shared/assets/x.css
    join(cwd, 'src', 'shared', 'ui', 'assets'),            // 3. app-lvl: src/shared/ui/assets/x.css
  ];
  const sharedTemplatesDirs = candidateTemplateDirs.filter(existsSync);
  const sharedAssetDirs = candidateAssetDirs.filter(existsSync);

  // Load lang/en.json — retained for future tooling (e.g. missing-key lint).
  // v1.0.0+: @t() is runtime-resolved; the locale is passed to render() by the caller.
  const langPath = resolve(cwd, 'lang', 'en.json');
  const lang: Record<string, string> = existsSync(langPath)
    ? (JSON.parse(readFileSync(langPath, 'utf8')) as Record<string, string>)
    : {};

  const outDir = resolve(cwd, APP_PATHS.viewsCache);
  const paths: string[] = [];

  for (const modName of readdirSync(modulesDir)) {
    // Skip the Shared module — it only contains layouts and shared assets,
    // never standalone page templates.
    if (modName === 'Shared') continue;

    const templatesDir = join(modulesDir, modName, 'ui', 'web', 'templates');
    if (!existsSync(templatesDir)) continue;

    const assetDirs = [
      join(modulesDir, modName, 'ui', 'web', 'assets'), // ui/web/assets (standard)
      join(modulesDir, modName, 'ui', 'assets'),         // ui/assets (flat convention)
    ].filter(existsSync);
    const htmlFiles = readdirSync(templatesDir).filter((f: string) => f.endsWith('.html'));

    for (const file of htmlFiles) {
      const src = readFileSync(join(templatesDir, file), 'utf8');
      const ctx: CompileContext = {
        assetDirs,
        templatesDir,
        ...(sharedTemplatesDirs.length > 0 && { sharedTemplatesDirs }),
        ...(sharedAssetDirs.length > 0 && { sharedAssetDirs }),
        ...(options.minify !== undefined && { minify: options.minify }),
      };
      const compiled = compileTemplate(src, ctx, lang);
      const outFile = join(outDir, basename(file, '.html') + '.ts');

      mkdirSync(outDir, { recursive: true });
      writeFileSync(outFile, compiled, 'utf8');
      paths.push(outFile);
    }
  }

  return { compiled: paths.length, paths };
}

/**
 * Removes the `storage/framework/cache/views/` directory entirely.
 */
export async function viewClear(cwd = process.cwd()): Promise<ViewClearResult> {
  const dir = resolve(cwd, APP_PATHS.viewsCache);
  if (!existsSync(dir)) return { cleared: false, dir };
  rmSync(dir, { recursive: true, force: true });
  return { cleared: true, dir };
}
