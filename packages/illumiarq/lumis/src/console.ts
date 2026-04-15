const ESC = '\u001B['

function wrap(code: string, value: string): string {
  return `${ESC}${code}m${value}${ESC}0m`
}

export const ui = {
  bold: (value: string): string => wrap('1', value),
  dim: (value: string): string => wrap('2', value),
  red: (value: string): string => wrap('31', value),
  green: (value: string): string => wrap('32', value),
  yellow: (value: string): string => wrap('33', value),
  blue: (value: string): string => wrap('34', value),
  magenta: (value: string): string => wrap('35', value),
  cyan: (value: string): string => wrap('36', value),
  gray: (value: string): string => wrap('90', value),
  section: (label: string): string => `${wrap('1;35', 'Lumis')} ${wrap('2', '::')} ${wrap('1;36', label)}`,
  ok: (value: string): string => `${wrap('32', '✓')} ${value}`,
  warn: (value: string): string => `${wrap('33', '▲')} ${value}`,
  fail: (value: string): string => `${wrap('31', '✖')} ${value}`,
  bullet: (value: string): string => `${wrap('36', '•')} ${value}`,
}

export function writeLine(message = ''): void {
  process.stdout.write(`${message}\n`)
}

export function writeError(message: string): void {
  process.stderr.write(`${message}\n`)
}