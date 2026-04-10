export type PortoLayer =
  | 'http'
  | 'logic'
  | 'contracts'
  | 'ui'
  | 'database'
  | 'events'
  | 'bootstrap';

export interface PortoLayerState {
  layer: PortoLayer;
  path: string;
  exists: boolean;
  required: boolean;
}

export interface PortoStructure {
  moduleRoot: string;
  requiredLayers: PortoLayerState[];
  optionalLayers: PortoLayerState[];
}

export interface PortoValidationResult {
  isValid: boolean;
  structure: PortoStructure;
  errors: string[];
}
