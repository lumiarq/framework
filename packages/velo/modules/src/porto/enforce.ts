import { validateModuleStructure } from './validate.js';

export function enforcePortoStructure(moduleRoot: string): void {
  const result = validateModuleStructure(moduleRoot);

  if (!result.isValid) {
    throw new Error(result.errors.join('\n'));
  }
}
