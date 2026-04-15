import path from 'node:path';
import { getDefaultScaffoldFiles, writeScaffoldFiles } from './scaffold.js';

export function createLumiarqApp(options = {}) {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const files = getDefaultScaffoldFiles();

  writeScaffoldFiles(projectRoot, files);

  return { projectRoot };
}
//# sourceMappingURL=create-app.js.map
