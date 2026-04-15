/**
 * veil-printer.ts
 *
 * Reconstructs formatted Veil template source from the VeilNode AST.
 *
 * Formatting rules:
 *  - Directive-only lines keep one directive per line with no trailing space
 *  - Block directives (@section, @if, @foreach …) indent their children by
 *    `tabWidth` spaces (defaults to 2)
 *  - Self-closing directives (@vars, @extends, @include …) always stay on
 *    their own line with no trailing space
 *  - @vars and @extends are always placed at the very top of the file,
 *    separated by a blank line from the rest
 *  - Raw HTML blocks are reformatted by stripping only leading/trailing blank
 *    lines and normalising internal indentation; Tailwind class strings are
 *    left for prettier-plugin-tailwindcss if it is loaded alongside this plugin
 *  - A single trailing newline is guaranteed
 */

import type { VeilNode, VeilBlockNode, VeilDirectiveNode, VeilRawNode } from './veil-parser.js';

// ── Options ───────────────────────────────────────────────────────────────────

export interface PrintOptions {
  tabWidth: number;
  useTabs: boolean;
  printWidth: number;
}

const DEFAULT_OPTIONS: PrintOptions = {
  tabWidth: 2,
  useTabs: false,
  printWidth: 120,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function indent(depth: number, opts: PrintOptions): string {
  if (opts.useTabs) return '\t'.repeat(depth);
  return ' '.repeat(depth * opts.tabWidth);
}

function formatDirectiveLine(name: string, args: string): string {
  if (!args) return `@${name}`;
  // @import: no parens — output `@import type { Foo } from 'bar'` verbatim
  if (name === 'import') return `@import ${args}`;
  // Restore surrounding parens
  return `@${name}(${args})`;
}

function reindentHtml(raw: string, depth: number, opts: PrintOptions): string {
  const prefix = indent(depth, opts);
  // Normalise: collapse 3+ consecutive blank lines down to one blank line
  const normalised = raw.replace(/\n{3,}/g, '\n\n');
  const lines = normalised.split('\n');

  // Detect the minimum existing indentation across non-empty lines
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const leading = line.match(/^(\s*)/)?.[1]?.length ?? 0;
    if (leading < minIndent) minIndent = leading;
  }
  if (minIndent === Infinity) minIndent = 0;

  return lines
    .map((line) => {
      if (line.trim() === '') return '';
      const stripped = line.slice(minIndent);
      return `${prefix}${stripped}`;
    })
    .join('\n');
}

// ── Recursive printer ─────────────────────────────────────────────────────────

function printNode(node: VeilNode, depth: number, opts: PrintOptions): string {
  switch (node.type) {
    case 'directive':
      return printDirective(node, depth, opts);
    case 'block':
      return printBlock(node, depth, opts);
    case 'raw':
      return printRaw(node, depth, opts);
  }
}

function printDirective(node: VeilDirectiveNode, depth: number, opts: PrintOptions): string {
  return `${indent(depth, opts)}${formatDirectiveLine(node.name, node.args)}`;
}

function printBlock(node: VeilBlockNode, depth: number, opts: PrintOptions): string {
  const parts: string[] = [];
  const openLine = `${indent(depth, opts)}${formatDirectiveLine(node.name, node.args)}`;
  parts.push(openLine);

  for (const child of node.children) {
    const childStr = printNode(child, depth + 1, opts);
    if (childStr) parts.push(childStr);
  }

  const closeName = `end${node.name}`;
  parts.push(`${indent(depth, opts)}@${closeName}`);
  return parts.join('\n');
}

function printRaw(node: VeilRawNode, depth: number, opts: PrintOptions): string {
  // Strip only surrounding blank lines; preserve internal structure
  const trimmed = node.content.replace(/^\n+/, '').replace(/\n+$/, '');
  if (!trimmed) return '';
  return reindentHtml(trimmed, depth, opts);
}

// ── Top-level formatter ───────────────────────────────────────────────────────

/**
 * Hoists @vars and @extends to the top of the output (in that order),
 * then prints the rest of the nodes at depth 0.
 */
export function printVeil(nodes: VeilNode[], options: Partial<PrintOptions> = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Partition: hoist @vars and @extends to top
  const hoisted: string[] = [];
  const rest: string[] = [];

  let seenHoistable = false;

  for (const node of nodes) {
    if (node.type === 'directive' && (node.name === 'vars' || node.name === 'extends')) {
      hoisted.push(printDirective(node, 0, opts));
      seenHoistable = true;
    } else {
      const printed = printNode(node, 0, opts);
      if (printed) rest.push(printed);
    }
  }

  const sections: string[] = [];
  if (hoisted.length > 0) sections.push(hoisted.join('\n'));
  if (rest.length > 0) sections.push(rest.join('\n'));

  // Join hoisted and rest with a blank line separator when both exist
  const output = seenHoistable && rest.length > 0 ? sections.join('\n\n') : sections.join('\n');

  return output.trimEnd() + '\n';
}
