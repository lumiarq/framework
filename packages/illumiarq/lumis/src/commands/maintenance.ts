import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ui, writeLine } from '../console.js';

type MaintenanceOptions = {
  message?: string;
  secret?: string;
  allowedIps?: string[];
};

export function enableMaintenanceMode(
  options: MaintenanceOptions = {},
  cwd = process.cwd(),
): number {
  const targetPath = join(cwd, '.maintenance');
  const payload = {
    ...(options.message ? { message: options.message } : {}),
    ...(options.secret ? { secret: options.secret } : {}),
    ...(options.allowedIps && options.allowedIps.length > 0
      ? { allowedIps: options.allowedIps }
      : {}),
    downAt: new Date().toISOString(),
  };

  writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  writeLine();
  writeLine(ui.section('Maintenance Down'));
  writeLine(`  ${ui.ok(`Wrote ${targetPath}`)}`);
  if (options.message) {
    writeLine(`  ${ui.bullet(`message: ${options.message}`)}`);
  }
  if (options.allowedIps && options.allowedIps.length > 0) {
    writeLine(`  ${ui.bullet(`allow: ${options.allowedIps.join(', ')}`)}`);
  }
  writeLine();

  return 0;
}

export function disableMaintenanceMode(cwd = process.cwd()): number {
  const targetPath = join(cwd, '.maintenance');
  if (existsSync(targetPath)) {
    rmSync(targetPath, { force: true });
  }

  writeLine();
  writeLine(ui.section('Maintenance Up'));
  writeLine(`  ${ui.ok(`Removed ${targetPath}`)}`);
  writeLine();

  return 0;
}
