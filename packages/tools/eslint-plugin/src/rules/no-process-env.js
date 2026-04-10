/**
 * ESLint rule: process.env must only be accessed in src/env.ts.
 * This ensures all environment variable access is centralised and validated.
 */
const noProcessEnv = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow process.env access outside src/env.ts',
      recommended: true,
    },
    messages: {
      noProcessEnv:
        'Access process.env only in src/env.ts. Import typed values from env.ts instead.',
    },
    schema: [],
  },
  create(context) {
    // Allow access in env.ts itself
    const filename = context.getFilename();
    if (filename.endsWith('env.ts') || filename.endsWith('env.js')) {
      return {};
    }
    return {
      MemberExpression(node) {
        if (
          node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.object.name === 'process' &&
          node.object.property.type === 'Identifier' &&
          node.object.property.name === 'env'
        ) {
          context.report({ node, messageId: 'noProcessEnv' });
        } else if (
          node.object.type === 'Identifier' &&
          node.object.name === 'process' &&
          node.property.type === 'Identifier' &&
          node.property.name === 'env'
        ) {
          context.report({ node, messageId: 'noProcessEnv' });
        }
      },
    };
  },
};
export default noProcessEnv;
//# sourceMappingURL=no-process-env.js.map
