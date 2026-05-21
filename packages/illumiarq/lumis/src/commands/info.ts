import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { ui, writeLine } from '../console.js';

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
};

const ROOT_CONFIG_PATTERN =
  /^(?:eslint\.config\.[cm]?[jt]s|postcss\.config\.[cm]?[jt]s|playwright\.config\.[cm]?[jt]s|vitest\.config\.[cm]?[jt]s|components\.json|next\.config\.[cm]?[jt]s|vercel\.json|tsconfig(?:\.build)?\.json)$/;

function readPackageJson(cwd: string): PackageJson | null {
  const packageJsonPath = join(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
}

export function showInfo(cwd = process.cwd()): number {
  const packageJson = readPackageJson(cwd);
  const scripts = Object.keys(packageJson?.scripts ?? {});
  const layout = readProjectLayout(cwd);

  writeLine();
  writeLine(ui.section('Project Info'));
  writeLine(`  ${ui.bold('root')}      ${cwd}`);
  writeLine(`  ${ui.bold('package')}   ${packageJson?.name ?? '(unknown)'}`);
  writeLine(`  ${ui.bold('node')}      ${process.version}`);
  writeLine(`  ${ui.bold('bootstrap')} ${layout.bootstrap ? 'bootstrap/' : 'missing'}`);
  writeLine(`  ${ui.bold('config')}    ${layout.config ? 'config/' : 'missing'}`);
  writeLine(`  ${ui.bold('entry')}      ${layout.entry ? 'entry/' : 'missing'}`);
  writeLine(`  ${ui.bold('modules')}   ${layout.modules ? 'src/modules' : 'missing'}`);
  writeLine(
    `  ${ui.bold('root-configs')} ${layout.rootConfigs.length > 0 ? `${layout.rootConfigs.length} (${layout.rootConfigs.join(', ')})` : 'none'}`,
  );
  writeLine(`  ${ui.bold('scripts')}   ${scripts.length > 0 ? scripts.join(', ') : '(none)'}`);
  writeLine();

  return 0;
}

export function readProjectLayout(cwd = process.cwd()): {
  bootstrap: boolean;
  config: boolean;
  entry: boolean;
  modules: boolean;
  rootConfigs: string[];
} {
  return {
    bootstrap: existsSync(join(cwd, 'bootstrap')),
    config: existsSync(join(cwd, 'src', 'config')),
    entry: existsSync(join(cwd, 'entry')),
    modules: existsSync(join(cwd, 'src', 'modules')),
    rootConfigs: readdirSync(cwd)
      .filter((name) => ROOT_CONFIG_PATTERN.test(name))
      .sort(),
  };
}
