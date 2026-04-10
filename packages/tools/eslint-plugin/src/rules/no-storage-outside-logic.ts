import type { Rule } from 'eslint';

/** Methods on storage that constitute a dispatch-boundary violation. */
const STORAGE_METHODS = new Set(['put', 'get', 'delete', 'exists', 'url', 'temporaryUrl']);

/**
 * ESLint rule: storage.put() / storage.get() / etc. may only be called from
 * logic/actions/ or logic/tasks/ files.
 *
 * Storage I/O is an infrastructure side effect that belongs in the
 * business-logic layer. Handlers, Loaders, Repositories, Listeners,
 * and UI components must delegate to a Task (e.g. UploadFileTask).
 */
const noStorageOutsideLogic: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'storage calls are only permitted in logic/actions/ or logic/tasks/',
      recommended: true,
    },
    messages: {
      noStorageCall:
        'storage.{{ method }}() must only be called from logic/actions/ or logic/tasks/. ' +
        'Wrap file I/O in a Task (e.g. UploadFileTask) and call it from an Action.',
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename();
    const inLogicLayer = filename.includes('/logic/actions/') || filename.includes('/logic/tasks/');

    if (inLogicLayer) return {};

    return {
      CallExpression(node) {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'Identifier' &&
          node.callee.object.name === 'storage' &&
          node.callee.property.type === 'Identifier' &&
          STORAGE_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node,
            messageId: 'noStorageCall',
            data: { method: (node.callee.property as { name: string }).name },
          });
        }
      },
    };
  },
};

export default noStorageOutsideLogic;
