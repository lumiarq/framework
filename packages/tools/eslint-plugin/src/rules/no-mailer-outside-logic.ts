import type { Rule } from 'eslint';

const MAILER_METHODS = new Set(['send', 'queue']);

/**
 * ESLint rule: mailer.send() / mailer.queue() may only be called from
 * logic/actions/ or logic/tasks/ files.
 */
const noMailerOutsideLogic: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'mailer calls are only permitted in logic/actions/ or logic/tasks/',
      recommended: true,
    },
    messages: {
      noMailerCall:
        'mailer.{{ method }}() must only be called from logic/actions/ or logic/tasks/. ' +
        'Wrap email sending in a Task (e.g. SendWelcomeEmailTask) and call it from an Action.',
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
          node.callee.object.name === 'mailer' &&
          node.callee.property.type === 'Identifier' &&
          MAILER_METHODS.has(node.callee.property.name)
        ) {
          context.report({
            node,
            messageId: 'noMailerCall',
            data: { method: (node.callee.property as { name: string }).name },
          });
        }
      },
    };
  },
};

export default noMailerOutsideLogic;
