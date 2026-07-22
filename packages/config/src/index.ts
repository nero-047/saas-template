export {
  APPLICATIONS,
  ARCHITECTURE_TYPES,
  CONTRACT_FORMATS,
  DATABASE_PROVIDERS,
  FEATURES,
  QUEUE_PROVIDERS,
  type Application,
  type ArchitectureType,
  type ContractFormat,
  type DatabaseProvider,
  type Feature,
  type QueueProvider,
} from './catalogue.js';
export {
  ConfigValidationError,
  parseNeroConfig,
  type ConfigValidationIssue,
} from './parse.js';
export {
  PROJECT_CONFIG_DEFAULTS,
  projectConfigSchema,
  projectMetadataSchema,
  type NeroProjectConfig,
  type NeroProjectConfigInput,
} from './schema.js';

import type { NeroProjectConfigInput } from './schema.js';

export function defineConfig(
  config: NeroProjectConfigInput,
): NeroProjectConfigInput {
  return config;
}
