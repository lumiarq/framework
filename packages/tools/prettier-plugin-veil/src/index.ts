/**
 * @lumiarq/prettier-plugin-veil
 *
 * A Prettier plugin that understands Veil template syntax (.veil.html).
 * Register in .prettierrc:
 *
 *   { "plugins": ["@lumiarq/prettier-plugin-veil"] }
 *
 * Prettier will automatically apply this plugin to any file whose name ends
 * in `.veil.html` because we register the `veil-html` parser with that glob.
 */

import type { Parser, Plugin, Printer, SupportOptions } from 'prettier';
import { parseVeil, type VeilNode } from './veil-parser.js';
import { printVeil } from './veil-printer.js';

// ── AST type ──────────────────────────────────────────────────────────────────

interface VeilAst {
  type: 'veil-root';
  nodes: VeilNode[];
  // Prettier requires these fields on the root node
  start: number;
  end: number;
}

// ── Parser ────────────────────────────────────────────────────────────────────

const veilParser: Parser<VeilAst> = {
  astFormat: 'veil-ast',
  locStart: (node: VeilAst) => node.start,
  locEnd: (node: VeilAst) => node.end,

  parse(text): VeilAst {
    const nodes = parseVeil(text);
    return {
      type: 'veil-root',
      nodes,
      start: 0,
      end: text.length,
    };
  },
};

// ── Printer ───────────────────────────────────────────────────────────────────

const veilPrinter: Printer<VeilAst> = {
  print(path, options) {
    const node = path.node as VeilAst;
    if (node.type !== 'veil-root') return '';

    const formatted = printVeil(node.nodes, {
      tabWidth: (options as { tabWidth?: number }).tabWidth ?? 2,
      useTabs: (options as { useTabs?: boolean }).useTabs ?? false,
      printWidth: (options as { printWidth?: number }).printWidth ?? 120,
    });

    // Return as a Prettier Doc string — for a text-only printer this is valid
    return formatted;
  },
};

// ── Options ───────────────────────────────────────────────────────────────────

const options: SupportOptions = {
  veilSortTailwindClasses: {
    type: 'boolean',
    category: 'Veil',
    default: true,
    description:
      'Sort Tailwind utility classes in Veil templates. Requires prettier-plugin-tailwindcss to be installed.',
  },
};

// ── Plugin export ─────────────────────────────────────────────────────────────

const plugin: Plugin<VeilAst> = {
  languages: [
    {
      name: 'Veil',
      parsers: ['veil-html'],
      extensions: ['.veil.html'],
      vscodeLanguageIds: ['html'],
    },
  ],
  parsers: {
    'veil-html': veilParser,
  },
  printers: {
    'veil-ast': veilPrinter,
  },
  options,
};

export default plugin;
export { parseVeil, printVeil };
export type { VeilAst, VeilNode };
