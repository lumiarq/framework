import type { DefineModuleOptions, ModuleDefinition } from './types/module.types.js';

function toKebabCase(value: string): string {
  return value
    .replace(
      /([A-Z])/g,
      (match, letter, offset) => (offset > 0 ? '-' : '') + String(letter).toLowerCase(),
    )
    .replace(/^-/, '');
}

export function defineModule(options: DefineModuleOptions): ModuleDefinition {
  const { name, alias, priority = 100, prefix, middleware = {}, description } = options;

  return {
    name,
    alias: alias ?? toKebabCase(name),
    priority,
    middleware,
    ...(prefix !== undefined ? { prefix } : {}),
    ...(description !== undefined ? { description } : {}),
  };
}
