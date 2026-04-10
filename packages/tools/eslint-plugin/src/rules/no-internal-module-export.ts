import type { Rule } from 'eslint';

const INTERNAL_DIRS = [
  'actions',
  'tasks',
  'handlers',
  'repositories',
  'loaders',
  'events',
  'listeners',
  'policies',
];

/**
 * ESLint rule: Module index.ts files must not re-export internal members.
 * Only Actions, Models, Events, and Types should be exported from a module index.
 */
const noInternalModuleExport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Module index.ts files must not re-export internal members',
      recommended: true,
    },
    messages: {
      noInternalExport:
        "index.ts must not re-export from internal directory '{{dir}}'. Only Actions, Models, Events, and Types may be exported.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Only check index.ts files
    if (!filename.endsWith('index.ts') && !filename.endsWith('index.js')) {
      return {};
    }

    function checkSource(node: Rule.Node, source: string | null) {
      if (!source) return;
      const matched = INTERNAL_DIRS.find((dir) => {
        // Match /dir/ as a path segment in the import source
        return source.includes(`/${dir}/`) || source === `./${dir}` || source === `../${dir}`;
      });
      if (matched) {
        context.report({
          node,
          messageId: 'noInternalExport',
          data: { dir: matched },
        });
      }
    }

    return {
      ExportNamedDeclaration(node) {
        if (node.source) {
          checkSource(node as unknown as Rule.Node, node.source.value as string);
        }
      },
      ExportAllDeclaration(node) {
        if (node.source) {
          checkSource(node as unknown as Rule.Node, node.source.value as string);
        }
      },
    };
  },
};

export default noInternalModuleExport;
