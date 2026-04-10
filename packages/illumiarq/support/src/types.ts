/** A file to write to disk. Path is relative to the project root. */
export interface GeneratedFile {
  /** Relative path from the project root, e.g. "src/modules/User/module.ts" */
  path: string;
  /** TypeScript source content to write verbatim */
  content: string;
}

/**
 * Returns a .gitkeep placeholder to preserve an empty directory in git.
 * @param base - Directory base path, e.g. "src/modules/Blog"
 * @param dir  - Subdirectory to keep, e.g. "tests/unit"
 */
export function gitkeep(base: string, dir: string): GeneratedFile {
  return { path: `${base}/${dir}/.gitkeep`, content: '' };
}
