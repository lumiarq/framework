import path from 'node:path';
import { getDefaultScaffoldFiles, writeScaffoldFiles } from './scaffold.js';

export type CreateLumiarqAppOptions = {
  projectRoot?: string;
};

export function createLumiarqApp(options: CreateLumiarqAppOptions = {}): { projectRoot: string } {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd());
  const files = getDefaultScaffoldFiles();

  writeScaffoldFiles(projectRoot, files);

  return { projectRoot };
}
