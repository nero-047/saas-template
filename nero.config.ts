import type { NeroProjectConfigInput } from './packages/config/src/index.js';

const config = {
  version: 1,
  project: {
    name: 'nero-saas-template',
    displayName: 'Nero SaaS Template',
    description: 'Reusable multi-runtime SaaS platform foundation.',
  },
  architecture: 'b2b',
  applications: [
    'api',
    'worker',
    'web',
    'marketing',
    'admin',
    'compute',
    'rn',
    'flutter',
  ],
  platform: {
    database: { enabled: true, provider: 'postgresql' },
    queue: { enabled: true, provider: 'bullmq' },
    contracts: { enabled: true, format: 'openapi' },
  },
  features: [
    'authentication',
    'organizations',
    'workspaces',
    'rbac',
    'audit',
    'jobs',
  ],
} satisfies NeroProjectConfigInput;

export default config;
