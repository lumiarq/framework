export interface ModuleMiddlewareConfig {
  web?: string[];
  api?: string[];
}

export interface ModuleMetadata {
  description?: string;
  sourcePath?: string;
}

export interface ModuleConfig {
  name: string;
  alias?: string;
  priority?: number;
  prefix?: string;
  middleware?: ModuleMiddlewareConfig;
  description?: string;
}

export interface DefineModuleOptions extends ModuleConfig {}

export interface ModuleDefinition {
  name: string;
  alias: string;
  priority: number;
  prefix?: string;
  middleware: ModuleMiddlewareConfig;
  description?: string;
}
