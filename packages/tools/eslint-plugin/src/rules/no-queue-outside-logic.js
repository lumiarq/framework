const QUEUE_METHODS = new Set(['dispatch', 'later']);
/**
 * ESLint rule: queue.dispatch() / queue.later() may only be called from
 * logic/actions/ or logic/tasks/ files.
 */
const noQueueOutsideLogic = {
  meta: {
    type: 'problem',
    docs: {
      description: 'queue calls are only permitted in logic/actions/ or logic/tasks/',
      recommended: true,
    },
    messages: {
      noQueueCall:
        'queue.{{ method }}() must only be called from logic/actions/ or logic/tasks/. ' +
        'Dispatch jobs from an Action or a dedicated Task.',
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
          node.callee.object.name === 'queue' &&
          node.callee.property.type === 'Identifier' &&
          QUEUE_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node,
            messageId: 'noQueueCall',
            data: { method: node.callee.property.name },
          });
        }
      },
    };
  },
};
export default noQueueOutsideLogic;
//# sourceMappingURL=no-queue-outside-logic.js.map
