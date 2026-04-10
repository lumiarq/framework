import type { Rule } from 'eslint';

/**
 * ESLint rule: Cross-module imports must go through the target module's index.ts.
 * Direct imports from another module's internal files break encapsulation.
 */
const noCrossModuleBypass: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Cross-module imports must go through the module index.ts',
      recommended: true,
    },
    messages: {
      crossModuleBypass:
        "Import from '{{module}}/index.ts' instead of accessing internal module files directly.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();

    // Extract current module name from path
    const moduleMatch = filename.match(/src\/modules\/(\w+)\//);
    if (!moduleMatch) return {};
    const currentModule = moduleMatch[1];

    return {
      ImportDeclaration(node) {
        const source = node.source.value as string;

        // Check if importing from a different module's internals
        const crossModuleMatch = source.match(
          /src\/modules\/(\w+)\/(actions|tasks|handlers|repositories)\//,
        );
        if (crossModuleMatch && crossModuleMatch[1] !== currentModule) {
          context.report({
            node,
            messageId: 'crossModuleBypass',
            data: { module: crossModuleMatch[1] as string },
          });
        }
      },
    };
  },
};

export default noCrossModuleBypass;
