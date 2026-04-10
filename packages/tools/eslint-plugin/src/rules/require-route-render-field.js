/**
 * ESLint rule: All defineRoute() calls must include a `render` property.
 * The render field is required to associate a route with its UI component.
 */
const requireRouteRenderField = {
  meta: {
    type: 'problem',
    docs: {
      description: 'defineRoute() calls must include a render property',
      recommended: true,
    },
    messages: {
      missingRender:
        "defineRoute() is missing the required 'render' property. Every route must declare its render component.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        // Only check calls to defineRoute
        if (callee.type !== 'Identifier' || callee.name !== 'defineRoute') {
          return;
        }
        const firstArg = node.arguments[0];
        if (!firstArg || firstArg.type !== 'ObjectExpression') {
          return;
        }
        const hasRender = firstArg.properties.some(
          (prop) =>
            prop.type === 'Property' &&
            prop.key.type === 'Identifier' &&
            prop.key.name === 'render',
        );
        if (!hasRender) {
          context.report({ node, messageId: 'missingRender' });
        }
      },
    };
  },
};
export default requireRouteRenderField;
//# sourceMappingURL=require-route-render-field.js.map
