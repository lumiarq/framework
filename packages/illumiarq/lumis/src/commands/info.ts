import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ui, writeLine } from '../console.js'

type PackageJson = {
  name?: string
  scripts?: Record<string, string>
}

function readPackageJson(cwd: string): PackageJson | null {
  const packageJsonPath = join(cwd, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return null
  }

  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson
}

export function showInfo(cwd = process.cwd()): number {
  const packageJson = readPackageJson(cwd)
  const scripts = Object.keys(packageJson?.scripts ?? {})

  writeLine()
  writeLine(ui.section('Project Info'))
  writeLine(`  ${ui.bold('root')}      ${cwd}`)
  writeLine(`  ${ui.bold('package')}   ${packageJson?.name ?? '(unknown)'}`)
  writeLine(`  ${ui.bold('node')}      ${process.version}`)
  writeLine(`  ${ui.bold('modules')}   ${existsSync(join(cwd, 'src', 'modules')) ? 'src/modules' : 'missing'}`)
  writeLine(`  ${ui.bold('config')}    ${existsSync(join(cwd, 'config')) ? 'config/' : 'missing'}`)
  writeLine(`  ${ui.bold('scripts')}   ${scripts.length > 0 ? scripts.join(', ') : '(none)'}`)
  writeLine()

  return 0
}