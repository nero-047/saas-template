export interface ApiEnvironment {
  readonly port: number;
  readonly session: {
    readonly cookieName: string;
    readonly cookieSecure: boolean;
    readonly cookieSameSite: 'strict' | 'lax' | 'none';
    readonly ttlSeconds: number;
  };
}

const DEFAULT_PORT = 3000;
const DEFAULT_SESSION_COOKIE_NAME = 'session';
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function parseInteger(
  value: string | undefined,
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!value?.trim()) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}.`,
    );
  }

  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < minimum || result > maximum) {
    throw new Error(
      `${name} must be an integer between ${minimum} and ${maximum}.`,
    );
  }

  return result;
}

function parseBoolean(
  value: string | undefined,
  name: string,
  fallback: boolean,
): boolean {
  if (!value?.trim()) {
    return fallback;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`${name} must be true or false.`);
}

export function loadApiEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ApiEnvironment {
  const port = parseInteger(environment.PORT, 'PORT', DEFAULT_PORT, 1, 65535);
  const cookieName =
    environment.SESSION_COOKIE_NAME?.trim() || DEFAULT_SESSION_COOKIE_NAME;
  if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(cookieName)) {
    throw new Error('SESSION_COOKIE_NAME must be a valid cookie name.');
  }

  const cookieSecure = parseBoolean(
    environment.SESSION_COOKIE_SECURE,
    'SESSION_COOKIE_SECURE',
    environment.NODE_ENV === 'production',
  );
  if (
    (cookieName.startsWith('__Host-') || cookieName.startsWith('__Secure-')) &&
    !cookieSecure
  ) {
    throw new Error(
      'SESSION_COOKIE_SECURE must be true for __Host- and __Secure- cookie names.',
    );
  }
  const cookieSameSite =
    environment.SESSION_COOKIE_SAME_SITE?.trim().toLowerCase() || 'lax';
  if (!['strict', 'lax', 'none'].includes(cookieSameSite)) {
    throw new Error('SESSION_COOKIE_SAME_SITE must be strict, lax, or none.');
  }
  if (cookieSameSite === 'none' && !cookieSecure) {
    throw new Error(
      'SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAME_SITE is none.',
    );
  }

  return {
    port,
    session: {
      cookieName,
      cookieSecure,
      cookieSameSite: cookieSameSite as 'strict' | 'lax' | 'none',
      ttlSeconds: parseInteger(
        environment.SESSION_TTL_SECONDS,
        'SESSION_TTL_SECONDS',
        DEFAULT_SESSION_TTL_SECONDS,
        300,
        60 * 60 * 24 * 365,
      ),
    },
  };
}
