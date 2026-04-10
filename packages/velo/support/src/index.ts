/**
 * @velo/support — code-generation primitives.
 * Pure utilities — no filesystem access. Consumed by lumis CLI and scaffold packages.
 */
export type { GeneratedFile } from './types.js';
export { gitkeep } from './types.js';
export { toPascalCase, toKebabCase } from './string-utils.js';
export { fillStub } from './fill-stub.js';
