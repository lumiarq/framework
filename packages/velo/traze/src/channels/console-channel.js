import chalk from 'chalk';
function colorizeLevel(level) {
  switch (level) {
    case 'debug':
      return chalk.gray(level.toUpperCase());
    case 'info':
      return chalk.cyan(level.toUpperCase());
    case 'warn':
      return chalk.yellow(level.toUpperCase());
    case 'error':
      return chalk.red(level.toUpperCase());
  }
}
function stringifyContext(entry, pretty) {
  const payload = {};
  if (entry.context && Object.keys(entry.context).length > 0) {
    payload.context = entry.context;
  }
  if (entry.metrics && Object.keys(entry.metrics).length > 0) {
    payload.metrics = entry.metrics;
  }
  if (Object.keys(payload).length === 0) {
    return '';
  }
  const json = pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
  return `\n${chalk.gray(json)}`;
}
export function createConsoleChannel(options = {}) {
  return {
    handle(entry) {
      const ts = chalk.dim(entry.timestamp.toISOString());
      const level = colorizeLevel(entry.level);
      const message = chalk.white(entry.message);
      const extra = stringifyContext(entry, options.pretty ?? false);
      const rendered = `${ts} ${level} ${message}${extra}`;
      if (entry.level === 'error') {
        console.error(rendered);
        return;
      }
      if (entry.level === 'warn') {
        console.warn(rendered);
        return;
      }
      console.log(rendered);
    },
  };
}
//# sourceMappingURL=console-channel.js.map
