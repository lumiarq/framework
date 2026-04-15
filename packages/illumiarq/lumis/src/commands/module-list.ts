import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { ui, writeLine } from '../console.js'

export function listModules(cwd = process.cwd()): number {
  const modulesDir = join(cwd, 'src', 'modules')
  if (!existsSync(modulesDir)) {
    writeLine()
    writeLine(ui.fail('No src/modules directory found.'))
    writeLine()
    return 1
  }

  const modules = readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  writeLine()
  writeLine(ui.section(`Modules (${modules.length})`))
  if (modules.length === 0) {
    writeLine(`  ${ui.dim('No modules discovered.')}`)
  }
  for (const moduleName of modules) {
    writeLine(`  ${ui.bullet(moduleName)}`)
  }
  writeLine()

  return 0
}