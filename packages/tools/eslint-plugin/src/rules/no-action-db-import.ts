import type { Rule } from 'eslint';

/**
 * ESLint rule: Actions must not import database/ORM primitives directly.
 * Actions orchestrate Tasks — they must not touch the database layer.
 */
const noActionDbImport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Actions must not import DB/ORM primitives directly',
      recommended: true,
    },
    messages: {
      noDbImport: 'Actions must not import DB/ORM primitives. Use a Task → Repository instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isAction = filename.includes('/actions/') && filename.endsWith('.action.ts');
    if (!isAction) return {};

    const forbiddenPatterns = [
      'drizzle-orm',
      '@libsql/client',
      'better-sqlite3',
      '/database/',
      '/repositories/',
    ];

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;
        if (forbiddenPatterns.some((p) => source.includes(p))) {
          context.report({ node, messageId: 'noDbImport' });
        }
      },
    };
  },
};

export default noActionDbImport;
