/**
 * ESLint rule: Repository subclasses must not define static methods.
 *
 * Static methods on repositories break the `BaseRepository.db` transaction-injection
 * mechanism — `this.db` is instance-level and resolves the test transaction
 * connection from ALS. A static method has no `this`, making it impossible to
 * swap connections inside `withTestContext()`.
 *
 * Invariant §{no-static-repository-methods}: All repository methods must be
 * instance methods so that `this.db` correctly resolves in test transactions.
 */
const noStaticRepositoryMethods = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Repository classes must not define static methods (breaks test transaction injection)',
      recommended: true,
    },
    messages: {
      noStaticMethod:
        'Repository static methods bypass the BaseRepository.db transaction mechanism. ' +
        'Convert to an instance method or extract to a standalone function.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isRepository = filename.includes('/repositories/') && filename.endsWith('.repository.ts');
    if (!isRepository) return {};
    return {
      MethodDefinition(node) {
        if (node.static) {
          context.report({ node, messageId: 'noStaticMethod' });
        }
      },
    };
  },
};
export default noStaticRepositoryMethods;
//# sourceMappingURL=no-static-repository-methods.js.map
