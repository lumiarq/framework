/**
 * Converts any string to PascalCase.
 * Handles kebab-case, snake_case, space-separated, and already-pascal inputs.
 *
 * @example
 * toPascalCase('publish-post')  // → 'PublishPost'
 * toPascalCase('create_user')   // → 'CreateUser'
 * toPascalCase('Blog')          // → 'Blog'
 */
export function toPascalCase(name) {
  return name
    .split(/[-_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('');
}
/**
 * Converts a PascalCase, camelCase, or already-kebab string to kebab-case.
 *
 * @example
 * toKebabCase('PublishPost')    // → 'publish-post'
 * toKebabCase('createUser')     // → 'create-user'
 * toKebabCase('publish-post')   // → 'publish-post'
 */
export function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}
//# sourceMappingURL=string-utils.js.map
