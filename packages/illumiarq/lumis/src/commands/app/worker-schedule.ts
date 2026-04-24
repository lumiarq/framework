import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

import { ui, writeError, writeLine } from '../../console.js';
import { runBridge, runPnpm } from './command-runtime.js';

export function workerStart(dev = false, cwd = process.cwd()): number {
  const workerFile = join(cwd, 'bootstrap', 'worker.ts');
  const workerBuilt = join(cwd, '.arc', 'node', 'worker.js');

  if (dev || !existsSync(workerBuilt)) {
    if (!existsSync(workerFile)) {
      writeError(
        ui.fail(
          'No bootstrap/worker.ts found. Run: lumis publish config queue  (then create bootstrap/worker.ts)',
        ),
      );
      return 1;
    }
    writeLine();
    writeLine(ui.section('Worker Start (dev)'));
    writeLine(`  ${ui.bullet(`Starting ${relative(cwd, workerFile)} via tsx...`)}`);
    writeLine(`  ${ui.dim('Press Ctrl+C to stop.')}`);
    writeLine();
    return runPnpm(['exec', 'tsx', workerFile], cwd);
  }

  writeLine();
  writeLine(ui.section('Worker Start'));
  writeLine(`  ${ui.bullet(`Starting ${relative(cwd, workerBuilt)}...`)}`);
  writeLine(`  ${ui.dim('Press Ctrl+C to stop.')}`);
  writeLine();
  return runPnpm(['exec', 'node', workerBuilt], cwd);
}

export function workerList(cwd = process.cwd()): number {
  const result = runBridge(['schedule:list', cwd], cwd);
  writeLine();
  writeLine(ui.section('Worker Status'));

  const workerFile = join(cwd, 'bootstrap', 'worker.ts');
  const workerBuilt = join(cwd, '.arc', 'node', 'worker.js');

  writeLine(
    `  ${ui.bullet('bootstrap/worker.ts')}  ${existsSync(workerFile) ? ui.ok('present') : ui.warn('missing')}`,
  );
  writeLine(
    `  ${ui.bullet('.arc/node/worker.js')}  ${existsSync(workerBuilt) ? ui.ok('built') : ui.dim('not built')}`,
  );
  writeLine();

  if (result.status === 0) {
    try {
      const parsed = JSON.parse(result.stdout) as {
        jobs: Array<{ name: string; cron: string; nextRun?: string }>;
      };
      if (parsed.jobs.length > 0) {
        writeLine(`  ${ui.bold('Scheduled Jobs')}`);
        for (const job of parsed.jobs) {
          const next = job.nextRun ? ui.dim(` next: ${job.nextRun}`) : '';
          writeLine(`    ${ui.bullet(job.name)}  ${ui.cyan(job.cron)}${next}`);
        }
        writeLine();
      }
    } catch {
      // ignore parse errors
    }
  }

  return 0;
}

export function scheduleList(cwd = process.cwd()): number {
  const result = runBridge(['schedule:list', cwd], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || 'Failed to list scheduled jobs.'));
    return result.status;
  }

  const parsed = JSON.parse(result.stdout) as {
    jobs: Array<{ name: string; cron: string; description?: string; nextRun?: string }>;
  };

  writeLine();
  writeLine(ui.section(`Scheduled Jobs (${parsed.jobs.length})`));
  if (parsed.jobs.length === 0) {
    writeLine(`  ${ui.dim('No scheduled jobs registered.')}`);
    writeLine(
      `  ${ui.dim('Export a scheduler from bootstrap/providers.ts and register jobs in bootstrap/schedule.ts.')}`,
    );
  } else {
    for (const job of parsed.jobs) {
      const desc = job.description ? ui.dim(` - ${job.description}`) : '';
      const next = job.nextRun ? ui.dim(`  (next: ${job.nextRun})`) : '';
      writeLine(`  ${ui.cyan(job.name.padEnd(30, ' '))} ${job.cron}${desc}${next}`);
    }
  }
  writeLine();
  return 0;
}

export function scheduleRun(jobName: string, cwd = process.cwd()): number {
  if (!jobName) {
    writeError(ui.fail('Usage: lumis schedule:run <JobName>'));
    return 1;
  }

  writeLine();
  writeLine(ui.section('Schedule Run'));
  writeLine(`  ${ui.bullet(`Running job: ${jobName}...`)}`);

  const result = runBridge(['schedule:run', cwd, jobName], cwd);
  if (result.status !== 0) {
    writeError(ui.fail(result.stderr.trim() || `Failed to run job "${jobName}".`));
    return result.status;
  }

  writeLine(`  ${ui.ok(`Job "${jobName}" completed.`)}`);
  writeLine();
  return 0;
}
