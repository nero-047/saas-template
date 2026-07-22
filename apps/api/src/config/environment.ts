export interface ApiEnvironment {
  readonly port: number;
}

const DEFAULT_PORT = 3000;

export function loadApiEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): ApiEnvironment {
  const value = environment.PORT?.trim();

  if (!value) {
    return { port: DEFAULT_PORT };
  }

  if (!/^\d+$/.test(value)) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return { port };
}
