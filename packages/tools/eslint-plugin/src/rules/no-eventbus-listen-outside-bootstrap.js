/**
 * ESLint rule: EventBus.listen() calls are only allowed in bootstrap/events.ts.
 * All event listener registration must be centralised in the bootstrap layer.
 */
const noEventbusListenOutsideBootstrap = {
  meta: {
    type: 'problem',
    docs: {
      description: 'EventBus.listen() calls are only allowed in bootstrap/events.ts',
      recommended: true,
    },
    messages: {
      noEventbusListen:
        'EventBus.listen() may only be called in bootstrap/events.ts. Move this listener registration there.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    // Allow calls in bootstrap/events.ts (or .js)
    if (filename.includes('bootstrap/events')) {
      return {};
    }
    return {
      CallExpression(node) {
        const { callee } = node;
        if (
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'EventBus' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'listen'
        ) {
          context.report({ node, messageId: 'noEventbusListen' });
        }
      },
    };
  },
};
export default noEventbusListenOutsideBootstrap;
//# sourceMappingURL=no-eventbus-listen-outside-bootstrap.js.map
