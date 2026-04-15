import { spawn }           from 'node:child_process'
import { existsSync }      from 'node:fs'
import { spawnSync }       from 'node:child_process'
import { buildApp }        from './build.js'
import { writeServerWrapper } from '../server-wrapper.js'
import { arcNodeApp, appEnvFile } from '../paths.js'

export interface PreviewOptions {
  port?: number
  target?: 'node' | 'static' | 'cloudflare'
}

/**
 * `lumis preview` — preview the production build locally.
 *
 * Auto-builds if `.arc/node/app.js` is absent, then writes
 * `.arc/.server.mjs` and starts `node` (no --watch).
 *
 * @returns Exit code.
 */
export async function previewApp(options: PreviewOptions = {}, cwd = process.cwd()): Promise<number> {
  const target = options.target ?? 'node'
  const port = options.port ?? parseInt(process.env['PORT'] ?? '4000', 10)

  if (target !== 'node') {
    const script = `preview:${target}`
    const result = spawnSync('pnpm', ['run', script], {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, PORT: String(port) },
    })
    return result.status ?? 1
  }

  // Auto-build if bundle is missing
  if (!existsSync(arcNodeApp(cwd))) {
    console.log('\n  No bundle found — building first...\n')
    const code = buildApp({ target: 'node' }, cwd)
    if (code !== 0) {
      console.error('\n  Build failed.\n')
      return code
    }
  }

  const wrapperPath = writeServerWrapper(port, cwd)

  console.log(`\n  LumiARQ Preview  http://localhost:${port}\n`)

  const envPath    = appEnvFile(cwd)
  const envFileArg = existsSync(envPath) ? [`--env-file=${envPath}`] : []

  const server = spawn('node', [...envFileArg, wrapperPath], {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port) },
  })

  return new Promise<number>((resolve) => {
    server.on('close', (code) => resolve(code ?? 0))
  })
}
