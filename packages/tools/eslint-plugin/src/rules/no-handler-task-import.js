/**
 * ESLint rule: Handlers must not import from tasks/ or repositories/.
 * Handlers communicate with the application via Actions only.
 */
const noHandlerTaskImport = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Handlers must not import tasks or repositories directly',
      recommended: true,
    },
    messages: {
      noDirectTaskImport: 'Handlers must not import Tasks directly. Call an Action instead.',
      noDirectRepoImport: 'Handlers must not import Repositories directly. Use an Action → Task.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isHandler = filename.includes('/handlers/') && filename.endsWith('.handler.ts');
    if (!isHandler) return {};
    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (source.includes('/tasks/') || source.endsWith('.task')) {
          context.report({ node, messageId: 'noDirectTaskImport' });
        }
        if (source.includes('/repositories/') || source.endsWith('.repository')) {
          context.report({ node, messageId: 'noDirectRepoImport' });
        }
      },
    };
  },
};
export default noHandlerTaskImport;
//# sourceMappingURL=no-handler-task-import.js.map
