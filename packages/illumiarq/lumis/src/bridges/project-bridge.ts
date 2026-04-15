import { existsSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

function walk(dir: string, matcher: (filePath: string) => boolean, bucket: string[] = []): string[] {
  if (!existsSync(dir)) {
    return bucket
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, matcher, bucket)
      continue
    }

    if (matcher(fullPath)) {
      bucket.push(fullPath)
    }
  }

  return bucket
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redact(item))
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const result: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (/(secret|token|password|private|key)$/i.test(key)) {
      result[key] = '[redacted]'
      continue
    }
    result[key] = redact(child)
  }

  return result
}

async function listRoutes(projectRoot: string): Promise<void> {
  const { clearRegisteredRoutes, getRegisteredRoutes } = await import('@illumiarq/http')
  clearRegisteredRoutes()

  const routeFiles = walk(join(projectRoot, 'src', 'modules'), (filePath) => /\/http\/routes\/.+\.(ts|js)$/.test(filePath)).sort()
  for (const filePath of routeFiles) {
    await import(pathToFileURL(filePath).href)
  }

  const routes = getRegisteredRoutes().map((route) => ({
    method: route.method ?? 'GET',
    path: route.path,
    name: route.name ?? '',
    render: route.render ?? '',
    middleware: (route.middleware ?? []).map((item) => (typeof item === 'string' ? item : '[inline]')),
  }))

  process.stdout.write(`${JSON.stringify({ routes, routeFiles: routeFiles.map((item) => relative(projectRoot, item)) }, null, 2)}\n`)
}

async function showConfig(projectRoot: string, configName: string): Promise<void> {
  const candidates = [
    join(projectRoot, 'config', `${configName}.ts`),
    join(projectRoot, 'config', `${configName}.js`),
    join(projectRoot, 'config', `${configName}.mjs`),
    join(projectRoot, 'config', `${configName}.cjs`),
  ]
  const target = candidates.find((candidate) => existsSync(candidate))
  if (!target) {
    throw new Error(`Config file not found for ${configName}`)
  }

  const mod = await import(pathToFileURL(target).href)
  const resolved = 'default' in mod ? mod.default : mod
  process.stdout.write(`${JSON.stringify({ config: redact(resolved) }, null, 2)}\n`)
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2)
  const projectRoot = resolve(rest[0] ?? process.cwd())

  if (command === 'route:list') {
    await listRoutes(projectRoot)
    return
  }

  if (command === 'route:check') {
    await listRoutes(projectRoot)
    return
  }

  if (command === 'config:show') {
    const configName = rest[1]
    if (!configName) {
      throw new Error('Missing config name')
    }
    await showConfig(projectRoot, configName)
    return
  }

  throw new Error(`Unknown bridge command: ${command}`)
}

void main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})