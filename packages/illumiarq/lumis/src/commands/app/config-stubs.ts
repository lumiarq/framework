export const CONFIG_STUBS: Record<string, string> = {
  mail: `import { env } from '../../bootstrap/env.js';

const mail = {
  driver: env.MAIL_DRIVER ?? 'stub',

  smtp: {
    host: env.SMTP_HOST ?? 'localhost',
    port: Number(env.SMTP_PORT ?? 1025),
    secure: env.SMTP_SECURE === 'true',
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },

  resend: {
    apiKey: env.RESEND_API_KEY ?? '',
  },

  from: {
    address: env.MAIL_FROM_ADDRESS ?? 'hello@example.com',
    name: env.MAIL_FROM_NAME ?? 'Example App',
  },
} as const;

export default mail;
`,

  queue: `import { env } from '../../bootstrap/env.js';

const queue = {
  driver: env.QUEUE_DRIVER ?? 'stub',

  bullmq: {
    connection: {
      host: env.REDIS_HOST ?? '127.0.0.1',
      port: Number(env.REDIS_PORT ?? 6379),
    },
    defaultQueue: 'default',
    concurrency: Number(env.QUEUE_CONCURRENCY ?? 5),
  },
} as const;

export default queue;
`,

  cache: `import { env } from '../../bootstrap/env.js';

const cache = {
  driver: env.CACHE_DRIVER ?? 'memory',

  ttl: Number(env.CACHE_TTL ?? 3600),

  redis: {
    host: env.REDIS_HOST ?? '127.0.0.1',
    port: Number(env.REDIS_PORT ?? 6379),
    password: env.REDIS_PASSWORD,
    db: Number(env.REDIS_DB ?? 0),
    keyPrefix: env.CACHE_PREFIX ?? 'cache:',
  },
} as const;

export default cache;
`,

  storage: `import { env } from '../../bootstrap/env.js';

const storage = {
  disks: {
    default: {
      driver: env.STORAGE_DRIVER ?? 'local',
      root: env.STORAGE_ROOT ?? 'storage/app',
    },

    s3: {
      driver: 's3' as const,
      bucket: env.AWS_BUCKET ?? '',
      region: env.AWS_REGION ?? 'us-east-1',
      endpoint: env.AWS_ENDPOINT,
      accessKeyId: env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? '',
    },
  },
} as const;

export default storage;
`,

  session: `import { env } from '../../bootstrap/env.js';

const session = {
  driver: env.SESSION_DRIVER ?? 'cookie',
  secret: env.SESSION_SECRET ?? 'change-me-in-production',
  ttl: Number(env.SESSION_TTL ?? 86400),
  cookieName: 'lumiarq_session',
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
} as const;

export default session;
`,

  security: `import { env } from '../../bootstrap/env.js';

const security = {
  jwtSecret: env.JWT_SECRET ?? 'change-me-in-production',
  jwtTtl: Number(env.JWT_TTL ?? 3600),

  cors: {
    allowOrigins: (env.CORS_ORIGINS ?? '*').split(',').map((s) => s.trim()),
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  },

  rateLimit: {
    max: Number(env.RATE_LIMIT_MAX ?? 100),
    windowMs: Number(env.RATE_LIMIT_WINDOW ?? 60000),
  },
} as const;

export default security;
`,

  logging: `import { env } from '../../bootstrap/env.js';

const logging = {
  level: (env.LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error',
  driver: (env.LOG_DRIVER ?? 'console') as 'console' | 'traze',

  traze: {
    endpoint: env.TRAZE_ENDPOINT ?? '',
    apiKey: env.TRAZE_API_KEY ?? '',
    service: env.TRAZE_SERVICE ?? 'lumiarq-app',
  },
} as const;

export default logging;
`,

  auth: `import { env } from '../../bootstrap/env.js';

const auth = {
  guard: (env.AUTH_GUARD ?? 'jwt') as 'jwt' | 'session',
  secret: env.JWT_SECRET ?? 'change-me-in-production',

  jwt: {
    ttl: Number(env.JWT_TTL ?? 3600),
    refreshTtl: Number(env.JWT_REFRESH_TTL ?? 604800),
    algorithm: 'HS256' as const,
  },

  password: {
    rounds: Number(env.BCRYPT_ROUNDS ?? 12),
  },
} as const;

export default auth;
`,
};

export const KNOWN_CONFIG_NAMES = Object.keys(CONFIG_STUBS);
