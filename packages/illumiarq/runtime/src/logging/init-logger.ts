import {
  createConsoleChannel,
  createFileChannel,
  createHttpChannel,
  createLogger,
} from '@trazze/sdk';
import {
  getDefaultLoggingConfig,
  type RuntimeLoggingChannel,
  type RuntimeLoggingConfig,
} from '../config/load-logging.js';

/**
 * Initialize the runtime logger used by built-in observability middleware.
 *
 * Defaults to a console channel so apps have zero-config telemetry in local/dev.
 */
function createChannel(channel: RuntimeLoggingChannel, globalPrettify: boolean) {
  const driver = channel.driver ?? 'console';

  if (driver === 'file') {
    return createFileChannel({ path: channel.path ?? 'storage/logs/lumiarq.log' });
  }

  if (driver === 'http' && channel.endpoint) {
    return createHttpChannel({ endpoint: channel.endpoint, headers: channel.headers ?? {} });
  }

  return createConsoleChannel({ pretty: channel.pretty ?? globalPrettify });
}

export function initializeRuntimeLogger(config?: RuntimeLoggingConfig) {
  const resolved = config ?? getDefaultLoggingConfig();
  const prettify = resolved.prettify ?? process.env.NODE_ENV !== 'production';

  const channelsConfig = resolved.channels;
  const channels = channelsConfig
    ? Object.values(channelsConfig).map((channel) => createChannel(channel, prettify))
    : [createConsoleChannel({ pretty: prettify })];

  return createLogger({
    channels,
    context: {
      system: 'lumiarq-runtime',
      env: process.env.NODE_ENV ?? 'development',
      logLevel: resolved.level ?? 'info',
    },
  });
}
