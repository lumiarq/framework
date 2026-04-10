/**
 * ESLint rule: Application code must import from @lumiarq/framework, never from
 * internal @velo/* packages directly. Enforces Invariant 19.
 */
const FORBIDDEN_PACKAGES = [
  '@velo/core',
  '@velo/runtime',
  '@velo/database',
  '@velo/migrations',
  '@velo/adapters',
  '@velo/build',
  '@velo/auth',
  '@velo/auth-starter',
  '@velo/support',
  '@velo/query',
  '@velo/http',
  '@velo/veil',
  '@velo/contracts',
  '@velo/security',
  '@velo/search',
  '@velo/context',
  '@velo/modules',
  '@velo/cache',
  '@velo/testing',
  '@velo/tinker',
  '@velo/traze',
];
function isForbidden(source) {
  return FORBIDDEN_PACKAGES.some((pkg) => source === pkg || source.startsWith(pkg + '/'));
}
const noFrameworkSubpackageImport = {
  meta: {
    type: 'problem',
    docs: {
      description: "Import from '@lumiarq/framework' instead of internal @velo/* packages directly",
      recommended: true,
    },
    messages: {
      noSubpackageImport: "Import from '@lumiarq/framework' instead of '{{ pkg }}' directly.",
    },
    schema: [],
  },
  create(context) {
    function checkSource(node, source) {
      if (isForbidden(source)) {
        context.report({
          node,
          messageId: 'noSubpackageImport',
          data: { pkg: source },
        });
      }
    }
    return {
      ImportDeclaration(node) {
        checkSource(node, node.source.value);
      },
      CallExpression(node) {
        // require('...')
        const firstArg = node.arguments[0];
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          firstArg !== undefined &&
          firstArg.type === 'Literal'
        ) {
          const value = firstArg.value;
          if (typeof value === 'string') {
            checkSource(node, value);
          }
        }
      },
    };
  },
};
export default noFrameworkSubpackageImport;
//# sourceMappingURL=no-framework-subpackage-import.js.map
