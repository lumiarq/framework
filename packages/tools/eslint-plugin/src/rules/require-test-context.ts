import type { Rule } from 'eslint';

/**
 * ESLint rule: Action tests must wrap test bodies with `withTestContext()`.
 *
 * Action tests that call `.execute()` directly (outside a `withTestContext()` wrapper)
 * will run without a proper execution context or transaction isolation. This can cause
 * silent failures or real database mutations that leak between test runs.
 *
 * Invariant §{require-test-context}: Any test file that imports an Action must also
 * import `withTestContext` from `@lumiarq/runtime`.
 */
const requireTestContext: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Action test files must import withTestContext to ensure proper execution context',
      recommended: true,
    },
    messages: {
      missingTestContext:
        'This test file imports an Action but does not import `withTestContext` from ' +
        '`@lumiarq/runtime`. Wrap `it()` callbacks with `withTestContext({}, async () => { ... })` ' +
        'to ensure proper execution context and transaction isolation.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    // Only apply to test files
    if (!filename.endsWith('.test.ts') && !filename.endsWith('.test.js')) return {};

    let importsAction = false;
    let importsTestContext = false;
    let actionImportNode: Rule.Node | null = null;

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;

        // Detect Action imports (any specifier ending in 'Action')
        if (!importsAction) {
          const hasActionSpecifier = node.specifiers.some(
            (s) => s.type === 'ImportSpecifier' && /Action$/.test(s.local.name),
          );
          if (hasActionSpecifier) {
            importsAction = true;
            actionImportNode = node as unknown as Rule.Node;
          }
        }

        // Detect withTestContext import
        if (source === '@lumiarq/runtime' || source.includes('@lumiarq/runtime')) {
          const hasTestContext = node.specifiers.some(
            (s) => s.type === 'ImportSpecifier' && s.local.name === 'withTestContext',
          );
          if (hasTestContext) importsTestContext = true;
        }
      },

      'Program:exit'() {
        if (importsAction && !importsTestContext && actionImportNode) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          context.report({ node: actionImportNode as any, messageId: 'missingTestContext' });
        }
      },
    };
  },
};

export default requireTestContext;
