import { projectConfigSchema, type NeroProjectConfig } from './schema.js';

export interface ConfigValidationIssue {
  readonly message: string;
  readonly path: string;
}

export class ConfigValidationError extends Error {
  readonly issues: readonly ConfigValidationIssue[];

  constructor(issues: readonly ConfigValidationIssue[]) {
    const summary = issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ');
    super(`Invalid Nero configuration: ${summary}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

export function parseNeroConfig(value: unknown): NeroProjectConfig {
  const result = projectConfigSchema.safeParse(value);
  if (!result.success) {
    throw new ConfigValidationError(
      result.error.issues.map((issue) => ({
        message: issue.message,
        path: issue.path.length > 0 ? issue.path.join('.') : '<root>',
      })),
    );
  }
  return result.data;
}
