import type { Rule } from 'eslint';

/**
 * ESLint rule: Loader files must not import Actions.
 * Loaders should only prepare data; orchestration belongs in Actions.
 */
const noActionInLoader: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Loader files must not import Actions',
      recommended: true,
    },
    messages: {
      noActionImport:
        'Loader files must not import Actions. Move orchestration logic out of the loader.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Only check loader files
    const isLoader =
      filename.includes('/loaders/') ||
      filename.endsWith('.loader.ts') ||
      filename.endsWith('.loader.js');
    if (!isLoader) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;
        if (
          source.includes('/actions/') ||
          source.endsWith('.action.ts') ||
          source.endsWith('.action.js')
        ) {
          context.report({ node, messageId: 'noActionImport' });
        }
      },
    };
  },
};

export default noActionInLoader;
