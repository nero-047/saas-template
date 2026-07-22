import { z } from 'zod';

import {
  APPLICATIONS,
  ARCHITECTURE_TYPES,
  CONTRACT_FORMATS,
  DATABASE_PROVIDERS,
  FEATURES,
  QUEUE_PROVIDERS,
} from './catalogue.js';

export const PROJECT_CONFIG_DEFAULTS = Object.freeze({
  architecture: 'blank' as const,
  applications: [] as const,
  features: [] as const,
  platform: Object.freeze({
    database: Object.freeze({
      enabled: false,
      provider: 'postgresql' as const,
    }),
    queue: Object.freeze({ enabled: false, provider: 'bullmq' as const }),
    contracts: Object.freeze({ enabled: false, format: 'openapi' as const }),
  }),
  version: 1 as const,
});

const uniqueValues = (values: readonly string[]) =>
  new Set(values).size === values.length;

export const projectMetadataSchema = z.strictObject({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Project name must use lowercase letters, numbers, and single hyphens.',
    ),
  displayName: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(500).optional(),
});

const databaseSchema = z
  .strictObject({
    enabled: z
      .boolean()
      .default(PROJECT_CONFIG_DEFAULTS.platform.database.enabled),
    provider: z
      .enum(DATABASE_PROVIDERS)
      .default(PROJECT_CONFIG_DEFAULTS.platform.database.provider),
  })
  .default(PROJECT_CONFIG_DEFAULTS.platform.database);

const queueSchema = z
  .strictObject({
    enabled: z
      .boolean()
      .default(PROJECT_CONFIG_DEFAULTS.platform.queue.enabled),
    provider: z
      .enum(QUEUE_PROVIDERS)
      .default(PROJECT_CONFIG_DEFAULTS.platform.queue.provider),
  })
  .default(PROJECT_CONFIG_DEFAULTS.platform.queue);

const contractsSchema = z
  .strictObject({
    enabled: z
      .boolean()
      .default(PROJECT_CONFIG_DEFAULTS.platform.contracts.enabled),
    format: z
      .enum(CONTRACT_FORMATS)
      .default(PROJECT_CONFIG_DEFAULTS.platform.contracts.format),
  })
  .default(PROJECT_CONFIG_DEFAULTS.platform.contracts);

export const projectConfigSchema = z.strictObject({
  version: z.literal(1).default(PROJECT_CONFIG_DEFAULTS.version),
  project: projectMetadataSchema,
  architecture: z
    .enum(ARCHITECTURE_TYPES)
    .default(PROJECT_CONFIG_DEFAULTS.architecture),
  applications: z
    .array(z.enum(APPLICATIONS))
    .max(APPLICATIONS.length)
    .refine(uniqueValues, 'Applications must not contain duplicates.')
    .default([...PROJECT_CONFIG_DEFAULTS.applications]),
  platform: z
    .strictObject({
      database: databaseSchema,
      queue: queueSchema,
      contracts: contractsSchema,
    })
    .default(PROJECT_CONFIG_DEFAULTS.platform),
  features: z
    .array(z.enum(FEATURES))
    .max(FEATURES.length)
    .refine(uniqueValues, 'Features must not contain duplicates.')
    .default([...PROJECT_CONFIG_DEFAULTS.features]),
});

export type NeroProjectConfigInput = z.input<typeof projectConfigSchema>;
export type NeroProjectConfig = z.output<typeof projectConfigSchema>;
