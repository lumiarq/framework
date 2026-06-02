import {
  createDefaultLoggingConfigSource,
  createMiddlewareBootstrapSource,
  createWorkerBootstrapSource,
} from '../scaffold.js';
import type { Preset, ScaffoldFile } from '../types.js';
import { createPackageJson } from './package-json.js';

function baseConfigFiles(): ScaffoldFile[] {
  return [
    {
      path: 'src/config/app.ts',
      content: `import type { AppConfig } from '@lumiarq/framework';
import { env } from '@/bootstrap/env';

export default {
  name: env.APP_NAME,
  url: env.APP_URL,
} satisfies AppConfig;
`,
    },
    {
      path: 'src/config/database.ts',
      content: `import type { DatabaseConfig } from '@lumiarq/framework';
import { env } from '@/bootstrap/env';

export default {
  default: env.DB_CONNECTION,
  connections: {
    sqlite: {
      driver: 'sqlite',
      url: env.DATABASE_URL,
      foreignKeyConstraints: true,
    },
  },
} satisfies DatabaseConfig;
`,
    },
    {
      path: 'src/config/logging.ts',
      content: createDefaultLoggingConfigSource(),
    },
    {
      path: 'src/config/cache.ts',
      content: `export default { default: 'memory' } as const;
`,
    },
    {
      path: 'src/config/mail.ts',
      content: `export default { default: 'stub' } as const;
`,
    },
    {
      path: 'src/config/queue.ts',
      content: `export default { default: 'stub' } as const;
`,
    },
    {
      path: 'src/config/security.ts',
      content: `export default { csrf: { enabled: true } } as const;
`,
    },
    {
      path: 'src/config/session.ts',
      content: `export default { driver: 'memory', lifetime: '120m' } as const;
`,
    },
    {
      path: 'src/config/storage.ts',
      content: `export default {
  default: 'local',
  disks: { local: { driver: 'local', root: 'storage/app' } },
} as const;
`,
    },
  ];
}

function healthModuleApi(): ScaffoldFile[] {
  return [
    {
      path: 'src/modules/Health/module.ts',
      content: `import { defineModule } from '@lumiarq/framework';

export default defineModule({
  name: 'Health',
  alias: 'health',
  description: 'Health checks',
  priority: 200,
});
`,
    },
    {
      path: 'src/modules/Health/contracts/index.ts',
      content: `export type HealthStatus = {
  status: 'ok';
  version: string;
  uptime: number;
  timestamp: string;
};
`,
    },
    {
      path: 'src/modules/Health/logic/queries/get-health-status.query.ts',
      content: `import { defineQuery } from '@lumiarq/framework';
import type { HealthStatus } from '../../contracts/index.js';

const startedAt = Date.now();
const VERSION = '0.1.0';

export const getHealthStatus = defineQuery(async (): Promise<HealthStatus> => {
  return {
    status: 'ok',
    version: VERSION,
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  };
});
`,
    },
    {
      path: 'src/modules/Health/http/handlers/get-health.handler.ts',
      content: `import { defineHandler } from '@lumiarq/framework';
import { getHealthStatus } from '../../logic/queries/get-health-status.query.js';

export const healthHandler = defineHandler(async (ctx) => {
  const health = await getHealthStatus();
  return ctx.json(health);
});
`,
    },
    {
      path: 'src/modules/Health/http/routes/health.api.ts',
      content: `import { Route } from '@lumiarq/framework';
import { healthHandler } from '../handlers/get-health.handler.js';

Route.group({ prefix: '/v1', version: 1 }, () => {
  Route.get('/health', healthHandler, { name: 'api.health.status', render: 'dynamic' });
});
`,
    },
  ];
}

function welcomeWebModule(): ScaffoldFile[] {
  return [
    {
      path: 'src/modules/Welcome/module.ts',
      content: `import { defineModule } from '@lumiarq/framework';

export default defineModule({
  name: 'Welcome',
  alias: 'welcome',
  description: 'Welcome page',
  priority: 100,
});
`,
    },
    {
      path: 'src/modules/Welcome/http/handlers/welcome.handler.ts',
      content: `import { defineHandler } from '@lumiarq/framework';

export const welcomeHandler = defineHandler(async (ctx) => {
  return ctx.html('<!doctype html><html><body><h1>Welcome to LumiARQ</h1></body></html>');
});
`,
    },
    {
      path: 'src/modules/Welcome/http/routes/welcome.web.ts',
      content: `import { Route } from '@lumiarq/framework';
import { welcomeHandler } from '../handlers/welcome.handler.js';

Route.get('/', welcomeHandler, { name: 'web.welcome', render: 'dynamic' });
`,
    },
  ];
}

function routesLoader(imports: string[]): ScaffoldFile {
  const body = imports.map((i) => `import '${i}';`).join('\n');
  return {
    path: 'src/storage/framework/cache/routes.loader.ts',
    content: `// Generated starter — run \`lumis route:cache\` after adding routes.
${body}
`,
  };
}

export function getProjectFiles(projectName: string, preset: Preset): ScaffoldFile[] {
  const routeImports: string[] = [];
  const files: ScaffoldFile[] = [
    { path: 'package.json', content: createPackageJson(projectName, preset) },
    {
      path: 'tsconfig.json',
      content: `${JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            strict: true,
            noUncheckedIndexedAccess: true,
            verbatimModuleSyntax: true,
            paths: {
              '@/*': ['./src/*'],
              '@/modules/*': ['./src/modules/*'],
              '@/shared/*': ['./src/shared/*'],
              '@/bootstrap/*': ['./bootstrap/*'],
              '@/storage/*': ['./src/storage/*'],
              '@/config/*': ['./src/config/*'],
            },
            skipLibCheck: true,
          },
          include: ['src', 'bootstrap'],
          exclude: ['node_modules', 'dist'],
        },
        null,
        2,
      )}\n`,
    },
    {
      path: 'lumis.config.json',
      content: `${JSON.stringify({ paths: { storage: 'src/storage' } }, null, 2)}\n`,
    },
    {
      path: '.gitignore',
      content: `node_modules
dist
.arc
.env
storage/database.sqlite
*.log
.DS_Store
`,
    },
    {
      path: '.env.example',
      content: `APP_NAME=${projectName}
APP_URL=http://localhost:3000
APP_ENV=local
NODE_ENV=development
PORT=3000
DB_CONNECTION=sqlite
DATABASE_URL=file:./storage/database.sqlite
JWT_PRIVATE_KEY=
JWT_PUBLIC_KEY=
SESSION_SECRET=
`,
    },
    {
      path: 'README.md',
      content: `# ${projectName}

LumiARQ application (${preset}).

\`\`\`bash
pnpm install
cp .env.example .env   # or use the generated .env from create-lumiarq-app
pnpm dev
\`\`\`

- API health: \`GET /v1/health\`
- Regenerate routes: \`lumis route:cache\`
`,
    },
    {
      path: 'bootstrap/entry.ts',
      content: `import { boot } from '@lumiarq/framework';
import './env.js';
import './providers.js';
import '@/storage/framework/cache/routes.loader.js';

export default boot({});
`,
    },
    {
      path: 'bootstrap/env.ts',
      content: `import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production', 'local']).default('development'),
  APP_ENV: z.enum(['local', 'testing', 'staging', 'production']).default('local'),
  APP_NAME: z.string().min(1).default('LumiARQ App'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().default(3000),
  DB_CONNECTION: z.enum(['sqlite', 'postgres']).default('sqlite'),
  DATABASE_URL: z.string().min(1).default('file:./storage/database.sqlite'),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
`,
    },
    {
      path: 'bootstrap/providers.ts',
      content: `import type {
  CacheContract,
  LoggerContract,
  MailerContract,
  QueueContract,
  StorageContract,
} from '@lumiarq/framework/contracts';
import {
  RequestLogger,
  StubCache,
  StubMailer,
  StubQueue,
  StubStorage,
} from '@lumiarq/framework/runtime';
import loggingConfig from '@/config/logging.js';
import storageConfig from '@/config/storage.js';

export const logger: LoggerContract = new RequestLogger({
  level: loggingConfig.level,
  prettify: loggingConfig.prettify,
});
export const mailer: MailerContract = new StubMailer({ logger });
export const queue: QueueContract = new StubQueue({ logger });
export const storage: StorageContract = new StubStorage({
  root: storageConfig.disks.local.root,
  logger,
});
export const cache: CacheContract = new StubCache();
`,
    },
    { path: 'bootstrap/middleware.ts', content: createMiddlewareBootstrapSource() },
    { path: 'bootstrap/worker.ts', content: createWorkerBootstrapSource() },
    ...baseConfigFiles(),
  ];

  if (preset === 'domain-only') {
    files.push(
      {
        path: 'src/modules/Health/module.ts',
        content: `import { defineModule } from '@lumiarq/framework';

export default defineModule({
  name: 'Health',
  alias: 'health',
  description: 'Domain module (add HTTP routes when ready)',
  priority: 200,
});
`,
      },
      {
        path: 'src/modules/Health/logic/queries/get-health-status.query.ts',
        content: `import { defineQuery } from '@lumiarq/framework';

export const getHealthStatus = defineQuery(async () => ({ status: 'ok' as const }));
`,
      },
    );
    files.push(routesLoader([]));
    return files;
  }

  files.push(...healthModuleApi());
  routeImports.push('../../../modules/Health/http/routes/health.api');

  if (preset === 'full-stack') {
    files.push(...welcomeWebModule());
    routeImports.push('../../../modules/Welcome/http/routes/welcome.web');
  }

  files.push(routesLoader(routeImports));
  return files;
}
