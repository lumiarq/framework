import type { Rule } from 'eslint';

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

function isForbidden(source: string): boolean {
  return FORBIDDEN_PACKAGES.some((pkg) => source === pkg || source.startsWith(pkg + '/'));
}

const noFrameworkSubpackageImport: Rule.RuleModule = {
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
    function checkSource(node: Rule.Node, source: string): void {
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
        checkSource(node as unknown as Rule.Node, node.source.value as string);
      },
      CallExpression(node) {
        // require('...')
        const firstArg = node.arguments[0];
        if (
          node.callee.type === 'Identifier' &&
          (node.callee as { name: string }).name === 'require' &&
          firstArg !== undefined &&
          firstArg.type === 'Literal'
        ) {
          const value = (firstArg as { value: unknown }).value;
          if (typeof value === 'string') {
            checkSource(node as unknown as Rule.Node, value);
          }
        }
      },
    };
  },
};

export default noFrameworkSubpackageImport;
