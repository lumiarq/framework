/**
 * veil-parser.ts
 *
 * Parses .veil.html source text into a lightweight AST that the printer
 * can use to reconstruct properly-indented output.
 *
 * Veil directives supported:
 *   @vars({ ... })          — variable type declarations
 *   @extends('...')         — layout inheritance
 *   @section('name') / @endsection
 *   @include('...')         — partial includes
 *   @styles('...')          — stylesheet injection
 *   @scripts('...')         — script injection
 *   @if(...) / @elseif(...) / @else / @endif
 *   @foreach(...) / @endforeach
 *   @while(...) / @endwhile
 *   @slot('name') / @endslot
 *   @component('...') / @endcomponent
 *   <%= expr %>             — interpolation (treated as HTML text)
 */

// ── Node types ────────────────────────────────────────────────────────────────

export type VeilNode =
  | VeilDirectiveNode
  | VeilBlockNode
  | VeilRawNode;

/** A self-closing directive: @vars, @extends, @include, @styles, @scripts */
export interface VeilDirectiveNode {
  type: 'directive';
  name: string;
  args: string;
  raw: string;
}

/** A block directive pair: @section/@endsection, @if/@endif, @foreach/@endforeach, etc. */
export interface VeilBlockNode {
  type: 'block';
  name: string;
  args: string;
  children: VeilNode[];
  raw: string;
}

/** Raw HTML content between directives */
export interface VeilRawNode {
  type: 'raw';
  content: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Directives that open a block and require a closing @endX tag */
const BLOCK_OPEN_DIRECTIVES = new Set([
  'section',
  'if',
  'elseif',
  'else',
  'foreach',
  'while',
  'slot',
  'component',
  'push',
  'prepend',
]);

/** Directives that close a block */
const BLOCK_CLOSE_DIRECTIVES = new Set([
  'endsection',
  'endif',
  'endforeach',
  'endwhile',
  'endslot',
  'endcomponent',
  'endpush',
  'endprepend',
]);

/** Self-closing directives */
const SELF_CLOSING_DIRECTIVES = new Set([
  'vars',
  'extends',
  'import',
  'include',
  'styles',
  'scripts',
  'yield',
  'stack',
  'method',
  'csrf',
]);

/** All known Veil directives — anything else is raw content (e.g. Alpine.js @click, @keydown) */
const ALL_KNOWN_DIRECTIVES = new Set([
  ...BLOCK_OPEN_DIRECTIVES,
  ...BLOCK_CLOSE_DIRECTIVES,
  ...SELF_CLOSING_DIRECTIVES,
]);

// ── Tokenizer ─────────────────────────────────────────────────────────────────

interface Token {
  type: 'directive' | 'raw';
  raw: string;
  name?: string;
  args?: string;
}

/** Split source text into alternating raw-HTML and directive tokens */
function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  // @import captures the ENTIRE rest of the line (no parens needed).
  // Other directives capture an optional (...) or ({...}) argument block.
  const directiveRe = /(@import[^\n]*|@[a-zA-Z][a-zA-Z0-9]*(?:\([^)]*\))?(?:\(\{[^}]*\}\))?)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = directiveRe.exec(source)) !== null) {
    const before = source.slice(lastIndex, match.index);
    if (before) {
      tokens.push({ type: 'raw', raw: before });
    }

    const full = match[1]!;
    const nameMatch = /^@([a-zA-Z][a-zA-Z0-9]*)(.*)$/s.exec(full);
    if (nameMatch) {
      const name = nameMatch[1]!.toLowerCase();
      const rest = (nameMatch[2] ?? '').trim();
      // @import: rest of line is the import statement verbatim (no parens).
      // Other directives: strip surrounding parens, preserving inner content.
      const args = name === 'import'
        ? rest
        : rest.startsWith('(') && rest.endsWith(')')
          ? rest.slice(1, -1).trim()
          : rest;
      // Only known Veil directives become directive tokens.
      // Unknown @xxx patterns (Alpine.js @click, @keydown, etc.) stay raw.
      if (ALL_KNOWN_DIRECTIVES.has(name)) {
        tokens.push({ type: 'directive', raw: full, name, args });
      } else {
        tokens.push({ type: 'raw', raw: full });
      }
    } else {
      tokens.push({ type: 'raw', raw: full });
    }

    lastIndex = match.index + full.length;
  }

  const tail = source.slice(lastIndex);
  if (tail) {
    tokens.push({ type: 'raw', raw: tail });
  }

  return tokens;
}

// ── Parser ────────────────────────────────────────────────────────────────────

interface ParseContext {
  tokens: Token[];
  pos: number;
}

function peek(ctx: ParseContext): Token | undefined {
  return ctx.tokens[ctx.pos];
}

function consume(ctx: ParseContext): Token {
  const t = ctx.tokens[ctx.pos];
  if (!t) throw new Error('Unexpected end of Veil template');
  ctx.pos++;
  return t;
}

function parseNodes(ctx: ParseContext, until?: Set<string>): VeilNode[] {
  const nodes: VeilNode[] = [];

  while (ctx.pos < ctx.tokens.length) {
    const token = peek(ctx);
    if (!token) break;

    if (token.type === 'raw') {
      consume(ctx);
      // Only push non-empty raw nodes
      if (token.raw.trim() || token.raw.includes('\n')) {
        nodes.push({ type: 'raw', content: token.raw });
      }
      continue;
    }

    // directive token
    const name = token.name!;

    // Stop if we've hit a closing directive our parent is waiting for
    if (until && BLOCK_CLOSE_DIRECTIVES.has(name)) break;
    // Also stop on elseif/else if the parent @if is watching
    if (until?.has(name)) break;

    consume(ctx);

    if (BLOCK_CLOSE_DIRECTIVES.has(name)) {
      // Stray close directive — emit as raw to avoid dropping it silently
      nodes.push({ type: 'raw', content: token.raw });
      continue;
    }

    if (BLOCK_OPEN_DIRECTIVES.has(name)) {
      const closeTag = name === 'else' || name === 'elseif' ? undefined : `end${name}`;
      const waitFor = new Set<string>(closeTag ? [closeTag] : ['endif', 'elseif', 'else']);
      const children = parseNodes(ctx, waitFor);

      // Consume the matching close directive if present
      const next = peek(ctx);
      if (next?.type === 'directive' && next.name && BLOCK_CLOSE_DIRECTIVES.has(next.name)) {
        consume(ctx);
      }

      nodes.push({
        type: 'block',
        name,
        args: token.args ?? '',
        children,
        raw: token.raw,
      });
      continue;
    }

    // Self-closing or unknown directive
    nodes.push({
      type: 'directive',
      name,
      args: token.args ?? '',
      raw: token.raw,
    });
  }

  return nodes;
}

export function parseVeil(source: string): VeilNode[] {
  const tokens = tokenize(source);
  const ctx: ParseContext = { tokens, pos: 0 };
  return parseNodes(ctx);
}
