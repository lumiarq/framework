/**
 * Returns a .gitkeep placeholder to preserve an empty directory in git.
 * @param base - Directory base path, e.g. "src/modules/Blog"
 * @param dir  - Subdirectory to keep, e.g. "tests/unit"
 */
export function gitkeep(base, dir) {
  return { path: `${base}/${dir}/.gitkeep`, content: '' };
}
//# sourceMappingURL=types.js.map
