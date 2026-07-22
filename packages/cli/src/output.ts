import type {
  Application,
  ArchitectureType,
  Feature,
  NeroProjectConfig,
} from '@saas-template/config';

const ARCHITECTURE_LABELS: Readonly<Record<ArchitectureType, string>> = {
  b2b: 'B2B SaaS',
  consumer: 'Consumer SaaS',
  custom: 'Custom',
  blank: 'Blank',
};

const APPLICATION_LABELS: Readonly<Record<Application, string>> = {
  api: 'API',
  worker: 'Worker',
  web: 'Web',
  marketing: 'Marketing',
  admin: 'Admin',
  compute: 'Compute',
  rn: 'React Native',
  flutter: 'Flutter',
};

const FEATURE_LABELS: Readonly<Record<Feature, string>> = {
  authentication: 'Authentication',
  organizations: 'Organizations',
  workspaces: 'Workspaces',
  rbac: 'RBAC',
  audit: 'Audit',
  jobs: 'Jobs',
};

function selectionLines<TValue extends string>(
  values: readonly TValue[],
  labels: Readonly<Record<TValue, string>>,
): readonly string[] {
  return values.length > 0
    ? values.map((value) => `✓ ${labels[value]}`)
    : ['None'];
}

export function formatProjectInfo(config: NeroProjectConfig): string {
  return [
    'Nero SaaS Platform',
    '',
    'Project:',
    config.project.displayName ?? config.project.name,
    `Identifier: ${config.project.name}`,
    '',
    'Architecture:',
    ARCHITECTURE_LABELS[config.architecture],
    '',
    'Applications:',
    ...selectionLines(config.applications, APPLICATION_LABELS),
    '',
    'Features:',
    ...selectionLines(config.features, FEATURE_LABELS),
    '',
    'Database:',
    config.platform.database.enabled ? 'PostgreSQL' : 'Disabled',
    '',
    'Queue:',
    config.platform.queue.enabled ? 'BullMQ' : 'Disabled',
    '',
    'Contracts:',
    config.platform.contracts.enabled ? 'OpenAPI' : 'Disabled',
  ].join('\n');
}

export function formatHelp(): string {
  return [
    'Nero SaaS Platform',
    '',
    'Usage:',
    '  nero <command>',
    '',
    'Commands:',
    '  info    Show the current project configuration',
    '  doctor  Check local project health without changing files',
  ].join('\n');
}
