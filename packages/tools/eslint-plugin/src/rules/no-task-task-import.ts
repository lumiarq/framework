import type { Rule } from 'eslint';

/**
 * ESLint rule: Tasks must not import other Tasks.
 * Each Task performs exactly one unit of work. Composition is done in Actions.
 */
const noTaskTaskImport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Tasks must not call other Tasks',
      recommended: true,
    },
    messages: {
      noTaskImport: 'Tasks must not import other Tasks. Compose Tasks in Actions instead.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isTask = filename.includes('/tasks/') && filename.endsWith('.task.ts');
    if (!isTask) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;
        if (source.includes('/tasks/') || source.endsWith('.task')) {
          context.report({ node, messageId: 'noTaskImport' });
        }
      },
    };
  },
};

export default noTaskTaskImport;
