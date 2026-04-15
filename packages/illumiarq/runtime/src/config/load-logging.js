import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_LOGGING_CONFIG = {
  level: 'info',
  driver: 'console',
  default: 'console',
  prettify: process.env.NODE_ENV !== 'production',
  channels: {
    console: {
      driver: 'console',
    },
  },
};

function sanitizeLoggingConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_LOGGING_CONFIG };
  }

  const candidate = raw;
  const level = candidate.level ?? DEFAULT_LOGGING_CONFIG.level;
  const driver = candidate.driver ?? DEFAULT_LOGGING_CONFIG.driver;
  const defaultChannel = candidate.default ?? DEFAULT_LOGGING_CONFIG.default;
  const prettify = candidate.prettify ?? DEFAULT_LOGGING_CONFIG.prettify;
  const channels = candidate.channels ?? DEFAULT_LOGGING_CONFIG.channels;

  return {
    ...(level !== undefined ? { level } : {}),
    ...(driver !== undefined ? { driver } : {}),
    ...(defaultChannel !== undefined ? { default: defaultChannel } : {}),
    ...(prettify !== undefined ? { prettify } : {}),
    ...(channels !== undefined ? { channels } : {}),
  };
}

async function loadConfigModule(filePath) {
  const url = pathToFileURL(filePath);
  const module = await import(url.href);
  return sanitizeLoggingConfig(module.default ?? module.logging ?? module);
}

function loadJsonConfig(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return sanitizeLoggingConfig(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_LOGGING_CONFIG };
  }
}

export async function loadLoggingConfig(projectRoot) {
  const root = projectRoot ?? process.env.LUMIARQ_PROJECT_ROOT ?? process.cwd();
  const candidates = [
    path.join(root, 'config', 'logging.ts'),
    path.join(root, 'config', 'logging.mjs'),
    path.join(root, 'config', 'logging.js'),
    path.join(root, 'config', 'logging.cjs'),
    path.join(root, 'config', 'logging.json'),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    if (candidate.endsWith('.json')) {
      return loadJsonConfig(candidate);
    }

    try {
      return await loadConfigModule(candidate);
    } catch {
      return { ...DEFAULT_LOGGING_CONFIG };
    }
  }

  return { ...DEFAULT_LOGGING_CONFIG };
}

export function getDefaultLoggingConfig() {
  return { ...DEFAULT_LOGGING_CONFIG };
}
//# sourceMappingURL=load-logging.js.map
