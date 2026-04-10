import { parseVeil } from './veil-parser.js';
import { printVeil } from './veil-printer.js';

const veilParser = {
  astFormat: 'veil-ast',
  locStart: (node) => node.start,
  locEnd: (node) => node.end,
  parse(text) {
    const nodes = parseVeil(text);
    return { type: 'veil-root', nodes, start: 0, end: text.length };
  },
};

const veilPrinter = {
  print(path, options) {
    const node = path.node;
    if (node.type !== 'veil-root') return '';
    return printVeil(node.nodes, {
      tabWidth: options.tabWidth ?? 2,
      useTabs: options.useTabs ?? false,
      printWidth: options.printWidth ?? 120,
    });
  },
};

const options = {
  veilSortTailwindClasses: {
    type: 'boolean',
    category: 'Veil',
    default: true,
    description:
      'Sort Tailwind utility classes in Veil templates. Requires prettier-plugin-tailwindcss to be installed.',
  },
};

const plugin = {
  languages: [
    {
      name: 'Veil',
      parsers: ['veil-html'],
      extensions: ['.veil.html'],
      vscodeLanguageIds: ['html'],
    },
  ],
  parsers: { 'veil-html': veilParser },
  printers: { 'veil-ast': veilPrinter },
  options,
};

export default plugin;
export { parseVeil, printVeil };
