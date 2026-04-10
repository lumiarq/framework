import type { GeneratedFile } from '@velo/support';
import { loadUiStub } from './stubs.js';

const AUTH_BASE = 'src/modules/Auth';

const UI_PAGES = [
  'login-page',
  'register-page',
  'forgot-password-page',
  'reset-password-page',
  'verify-email-page',
  'confirm-password-page',
] as const;

type UiPage = (typeof UI_PAGES)[number];

// Maps UI framework to file extension
const EXT: Record<string, string> = {
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
export function generateAuthUI(uiFramework: 'react' | 'vue' | 'svelte' | 'solid'): GeneratedFile[] {
  const ext = EXT[uiFramework] ?? 'tsx';
  return UI_PAGES.map((page: UiPage) => ({
    path: `${AUTH_BASE}/ui/web/pages/${page}.${ext}`,
    content: loadUiStub(uiFramework, `${page}.stub`),
  }));
}
