import type { Rule } from 'eslint';

/**
 * ESLint rule: Application code must import from @lumiarq/framework, never from
 * internal @illumiarq/* packages directly. Enforces Invariant 19.
 */

const FORBIDDEN_PACKAGES = [
  '@illumiarq/core',
  '@illumiarq/runtime',
  '@illumiarq/database',
  '@illumiarq/migrations',
  '@illumiarq/adapters',
  '@illumiarq/build',
  '@illumiarq/auth',
  '@illumiarq/auth-starter',
  '@illumiarq/support',
  '@illumiarq/query',
  '@illumiarq/http',
  '@illumiarq/veil',
  '@illumiarq/contracts',
  '@illumiarq/security',
  '@illumiarq/search',
  '@illumiarq/context',
  '@illumiarq/modules',
  '@illumiarq/cache',
  '@illumiarq/testing',
  '@illumiarq/tinker',
  '@illumiarq/traze',
];

function isForbidden(source: string): boolean {
  return FORBIDDEN_PACKAGES.some((pkg) => source === pkg || source.startsWith(pkg + '/'));
}

const noFrameworkSubpackageImport: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Import from '@lumiarq/framework' instead of internal @illumiarq/* packages directly",
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
