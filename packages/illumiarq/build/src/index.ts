export { classifyRoute, classifyRoutes } from './strategy-classifier.js';
export type { RenderStrategy, ClassifiedRoute } from './strategy-classifier.js';

export { scanRouteModules } from './route-scanner.js';
export type { DiscoveredRoute, ModuleRecord } from './route-scanner.js';

export { prerenderRoutes, routePathToOutFile } from './prerender.js';
export type { PrerenderResult, RouteRenderer } from './prerender.js';

export { generateShells } from './shell-generator.js';
export type { ShellResult } from './shell-generator.js';

export { generateSitemap } from './sitemap-generator.js';
export type { SitemapOptions } from './sitemap-generator.js';

export { generateRobots } from './robots-generator.js';
export type { RobotsOptions } from './robots-generator.js';
