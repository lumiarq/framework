import { spawn, spawnSync } from 'node:child_process'
import { existsSync }       from 'node:fs'
import { writeServerWrapper } from '../server-wrapper.js'
import { arcNodeApp, appEnvFile } from '../paths.js'

export interface ServeOptions {
  port?: number
  host?: string
}

/**
 * `lumis serve` — LumiARQ development server.
 *
 * Steps:
 *  1. Run `pnpm run build:node` to produce `.arc/node/app.js`
 *  2. Write `.arc/.server.mjs` (bundles @illumiarq/adapters/node inline)
 *  3. Start `node --watch .arc/.server.mjs` — auto-restarts on changes
 *
 * @returns Exit code (0 on clean shutdown, non-zero on error).
 */
export async function serveApp(options: ServeOptions = {}, cwd = process.cwd()): Promise<number> {
  const port = options.port ?? parseInt(process.env['PORT'] ?? '4000', 10)
  const host = options.host ?? '0.0.0.0'

  // ── Step 1: Build node bundle ──────────────────────────────────────────────
  process.stdout.write('\n  Bundling app...')
  const build = spawnSync('pnpm', ['run', 'build:node'], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      APP_ENV: process.env['APP_ENV'] ?? 'local',
    },
  })

  if (build.status !== 0) {
    console.error(' failed.\n')
    if (build.stdout) process.stdout.write(build.stdout)
    if (build.stderr) process.stderr.write(build.stderr)
    return 1
  }
  console.log(' done.')

  // ── Step 2: Write server wrapper ───────────────────────────────────────────
  const wrapperPath = writeServerWrapper(port, cwd)

  // ── Step 3: Start with --watch ─────────────────────────────────────────────
  console.log(`\n  LumiARQ  http://${host}:${port}`)
  console.log(`  Watching .arc/ for changes...\n`)

  const envPath    = appEnvFile(cwd)
  const envFileArg = existsSync(envPath) ? [`--env-file=${envPath}`] : []

  const server = spawn('node', [...envFileArg, '--watch', wrapperPath], {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      APP_ENV: process.env['APP_ENV'] ?? 'local',
      HOST: host,
      PORT: String(port),
    },
  })

  return new Promise<number>((resolve) => {
    server.on('close', (code) => resolve(code ?? 0))
  })
}
