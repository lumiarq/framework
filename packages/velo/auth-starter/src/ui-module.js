import { loadUiStub } from './stubs.js';
const AUTH_BASE = 'src/modules/Auth';
const UI_PAGES = [
  'login-page',
  'register-page',
  'forgot-password-page',
  'reset-password-page',
  'verify-email-page',
  'confirm-password-page',
];
// Maps UI framework to file extension
const EXT = {
  react: 'tsx',
  vue: 'vue',
  svelte: 'svelte',
  solid: 'tsx',
};
/**
 * Generates UI page files for the Auth module.
 * Called by `lumis auth:install --ui <framework>`.
 *
 * React stubs are fully implemented. Vue/Svelte/Solid stubs return
 * placeholder TODO files — run `lumis stub:publish --auth` to customise.
 */
export function generateAuthUI(uiFramework) {
  const ext = EXT[uiFramework] ?? 'tsx';
  return UI_PAGES.map((page) => ({
    path: `${AUTH_BASE}/ui/web/pages/${page}.${ext}`,
    content: loadUiStub(uiFramework, `${page}.stub`),
  }));
}
//# sourceMappingURL=ui-module.js.map
