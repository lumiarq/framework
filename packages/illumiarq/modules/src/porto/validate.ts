import { existsSync } from 'node:fs';
import type { PortoLayer, PortoLayerState, PortoValidationResult } from '../types/porto.types.js';
import { getModulePaths } from './paths.js';

const REQUIRED_LAYERS: PortoLayer[] = ['http', 'logic', 'contracts'];
const OPTIONAL_LAYERS: PortoLayer[] = ['ui', 'database', 'events', 'bootstrap'];

function createState(layer: PortoLayer, path: string, required: boolean): PortoLayerState {
  return {
    layer,
    path,
    exists: existsSync(path),
    required,
  };
}

export function validateModuleStructure(moduleRoot: string): PortoValidationResult {
  const paths = getModulePaths(moduleRoot);

  const requiredLayers = REQUIRED_LAYERS.map((layer) => {
    switch (layer) {
      case 'http':
        return createState(layer, paths.httpDir, true);
      case 'logic':
        return createState(layer, paths.logicDir, true);
      case 'contracts':
        return createState(layer, paths.contractsDir, true);
      default:
        return createState(layer, paths.moduleRoot, true);
    }
  });

  const optionalLayers = OPTIONAL_LAYERS.map((layer) => {
    switch (layer) {
      case 'ui':
        return createState(layer, paths.uiDir, false);
      case 'database':
        return createState(layer, paths.databaseDir, false);
      case 'events':
        return createState(layer, paths.eventsDir, false);
      case 'bootstrap':
        return createState(layer, paths.bootstrapDir, false);
      default:
        return createState(layer, paths.moduleRoot, false);
    }
  });

  const errors = requiredLayers
    .filter((layer) => !layer.exists)
    .map((layer) => `Module is missing required Porto layer "${layer.layer}" at ${layer.path}`);

  return {
    isValid: errors.length === 0,
    structure: {
      moduleRoot: paths.moduleRoot,
      requiredLayers,
      optionalLayers,
    },
    errors,
  };
}
