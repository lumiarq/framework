import chalk from 'chalk';

export const style = {
  bold: (value: string) => chalk.bold(value),
  dim: (value: string) => chalk.dim(value),
  cyan: (value: string) => chalk.cyan(value),
  cyanBright: (value: string) => chalk.cyanBright(value),
  yellow: (value: string) => chalk.yellow(value),
  green: (value: string) => chalk.green(value),
  red: (value: string) => chalk.red(value),
  boldCyan: (value: string) => chalk.bold.cyan(value),
  boldYellow: (value: string) => chalk.bold.yellow(value),
  boldGreen: (value: string) => chalk.bold.green(value),
  successMark: () => chalk.green('✓'),
  warnMark: () => chalk.yellow('⚠'),
  errorMark: () => chalk.red('✗'),
  bullet: () => chalk.cyan('•'),
};

export type TrazeStyle = typeof style;
