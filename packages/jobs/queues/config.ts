export interface QueueConnectionConfig {
  readonly host: string;
  readonly port: number;
  readonly username?: string;
  readonly password?: string;
  readonly db: number;
  readonly tls?: Record<string, never>;
}

export interface QueueRuntimeConfig {
  readonly connection: QueueConnectionConfig;
  readonly prefix: string;
}

const DEFAULT_PREFIX = 'saas-template';

function parseDatabase(pathname: string): number {
  const value = pathname.replace(/^\//, '');
  if (!value) {
    return 0;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error('REDIS_URL database must be a non-negative integer.');
  }
  const database = Number(value);
  if (!Number.isSafeInteger(database)) {
    throw new Error('REDIS_URL database is outside the supported range.');
  }
  return database;
}

function decodeCredential(value: string, name: string): string | undefined {
  if (!value) {
    return undefined;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    throw new Error(`REDIS_URL ${name} must use valid percent encoding.`);
  }
}

export function loadQueueConfig(
  environment: NodeJS.ProcessEnv = process.env,
): QueueRuntimeConfig {
  const redisUrl = environment.REDIS_URL?.trim();
  if (!redisUrl) {
    throw new Error('REDIS_URL is required when queue infrastructure starts.');
  }

  let parsed: URL;
  try {
    parsed = new URL(redisUrl);
  } catch {
    throw new Error('REDIS_URL must be a valid Redis connection URL.');
  }
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use the redis or rediss protocol.');
  }
  if (!parsed.hostname) {
    throw new Error('REDIS_URL must include a hostname.');
  }

  const port = parsed.port
    ? Number(parsed.port)
    : parsed.protocol === 'rediss:'
      ? 6380
      : 6379;
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error('REDIS_URL port must be between 1 and 65535.');
  }

  const prefix = environment.QUEUE_PREFIX?.trim() || DEFAULT_PREFIX;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(prefix)) {
    throw new Error(
      'QUEUE_PREFIX must contain 1-64 letters, numbers, underscores, or hyphens.',
    );
  }

  return {
    connection: {
      host: parsed.hostname,
      port,
      username: decodeCredential(parsed.username, 'username'),
      password: decodeCredential(parsed.password, 'password'),
      db: parseDatabase(parsed.pathname),
      ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
    },
    prefix,
  };
}
