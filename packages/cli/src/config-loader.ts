import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import {
  ConfigValidationError,
  parseNeroConfig,
  type NeroProjectConfig,
} from '@saas-template/config';
import { createJiti } from 'jiti';

export const NERO_CONFIG_FILE = 'nero.config.ts';

const require = createRequire(import.meta.url);
const configPackagePath = require.resolve('@saas-template/config');

export class ConfigFileNotFoundError extends Error {
  readonly path: string;

  constructor(path: string) {
    super(`Nero configuration not found at ${path}.`);
    this.name = 'ConfigFileNotFoundError';
    this.path = path;
  }
}

export class ConfigFileLoadError extends Error {
  readonly path: string;

  constructor(path: string, options?: ErrorOptions) {
    super(`Unable to load Nero configuration at ${path}.`, options);
    this.name = 'ConfigFileLoadError';
    this.path = path;
  }
}

export async function loadNeroConfig(cwd: string): Promise<NeroProjectConfig> {
  const configPath = resolve(cwd, NERO_CONFIG_FILE);
  try {
    await access(configPath);
  } catch {
    throw new ConfigFileNotFoundError(configPath);
  }

  let configValue: unknown;
  try {
    const jiti = createJiti(import.meta.url, {
      alias: { '@saas-template/config': configPackagePath },
      fsCache: false,
      moduleCache: false,
    });
    configValue = await jiti.import(configPath, { default: true });
  } catch (error) {
    throw new ConfigFileLoadError(configPath, { cause: error });
  }

  try {
    return parseNeroConfig(configValue);
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }
    throw new ConfigFileLoadError(configPath, { cause: error });
  }
}
