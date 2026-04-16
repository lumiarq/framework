import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { join } from 'node:path';

import { ui, writeLine } from '../console.js';

type EnvMap = Map<string, string>;

function parseEnvFile(raw: string): EnvMap {
  const entries = new Map<string, string>();
  for (const line of raw.split(/\r?\n/g)) {
    if (!line || line.trim().startsWith('#')) continue;
    const equalsIndex = line.indexOf('=');
    if (equalsIndex <= 0) continue;
    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1);
    entries.set(key, value);
  }
  return entries;
}

function serializeEnv(entries: EnvMap): string {
  const lines = [...entries.entries()].map(([key, value]) => `${key}=${value}`);
  return `${lines.join('\n')}\n`;
}

function buildSecrets(): { privateKey: string; publicKey: string; sessionSecret: string } {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 4096,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });

  return {
    privateKey: JSON.stringify(privateKey).slice(1, -1),
    publicKey: JSON.stringify(publicKey).slice(1, -1),
    sessionSecret: randomBytes(32).toString('hex'),
  };
}

function writeSecrets(cwd: string, mode: 'generate' | 'rotate'): number {
  const envPath = join(cwd, '.env');
  const current = existsSync(envPath)
    ? parseEnvFile(readFileSync(envPath, 'utf8'))
    : new Map<string, string>();
  const secrets = buildSecrets();

  current.set('JWT_PRIVATE_KEY', secrets.privateKey);
  current.set('JWT_PUBLIC_KEY', secrets.publicKey);
  current.set('SESSION_SECRET', secrets.sessionSecret);

  writeFileSync(envPath, serializeEnv(current), 'utf8');

  writeLine();
  writeLine(ui.section(mode === 'generate' ? 'Key Generate' : 'Key Rotate'));
  writeLine(`  ${ui.ok(`Updated ${envPath}`)}`);
  writeLine(`  ${ui.bullet('JWT_PRIVATE_KEY refreshed')}`);
  writeLine(`  ${ui.bullet('JWT_PUBLIC_KEY refreshed')}`);
  writeLine(`  ${ui.bullet('SESSION_SECRET refreshed')}`);
  writeLine();

  return 0;
}

export function generateKeys(cwd = process.cwd()): number {
  return writeSecrets(cwd, 'generate');
}

export function rotateKeys(cwd = process.cwd()): number {
  return writeSecrets(cwd, 'rotate');
}
