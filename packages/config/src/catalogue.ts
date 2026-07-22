export const ARCHITECTURE_TYPES = [
  'b2b',
  'consumer',
  'custom',
  'blank',
] as const;

export const APPLICATIONS = [
  'api',
  'worker',
  'web',
  'marketing',
  'admin',
  'compute',
  'rn',
  'flutter',
] as const;

export const FEATURES = [
  'authentication',
  'organizations',
  'workspaces',
  'rbac',
  'audit',
  'jobs',
] as const;

export const DATABASE_PROVIDERS = ['postgresql'] as const;
export const QUEUE_PROVIDERS = ['bullmq'] as const;
export const CONTRACT_FORMATS = ['openapi'] as const;

export type ArchitectureType = (typeof ARCHITECTURE_TYPES)[number];
export type Application = (typeof APPLICATIONS)[number];
export type Feature = (typeof FEATURES)[number];
export type DatabaseProvider = (typeof DATABASE_PROVIDERS)[number];
export type QueueProvider = (typeof QUEUE_PROVIDERS)[number];
export type ContractFormat = (typeof CONTRACT_FORMATS)[number];
