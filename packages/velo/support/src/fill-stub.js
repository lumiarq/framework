/**
 * Replaces {{ Token }} placeholders in a stub template string.
 * Pure — no filesystem access.
 *
 * @param template - The stub file content with {{ Token }} placeholders
 * @param tokens   - Map of token names to replacement values
 */
export function fillStub(template, tokens) {
  return Object.entries(tokens).reduce(
    (acc, [key, val]) => acc.replaceAll(`{{ ${key} }}`, val),
    template,
  );
}
//# sourceMappingURL=fill-stub.js.map
