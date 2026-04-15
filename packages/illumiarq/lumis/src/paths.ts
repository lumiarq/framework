import { resolve } from 'node:path'

export const ARC_DIR       = '.arc'
export const ARC_NODE_APP  = `${ARC_DIR}/node/app.js`
export const ARC_SERVER    = `${ARC_DIR}/.server.mjs`

export const APP_ENV_FILE  = '.env'

export function arcDir(cwd: string): string {
  return resolve(cwd, ARC_DIR)
}

export function arcNodeApp(cwd: string): string {
  return resolve(cwd, ARC_NODE_APP)
}

export function arcServer(cwd: string): string {
  return resolve(cwd, ARC_SERVER)
}

export function appEnvFile(cwd: string): string {
  return resolve(cwd, APP_ENV_FILE)
}
