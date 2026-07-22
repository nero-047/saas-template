export interface PlatformJobProcessor {
  readonly jobName: string;
  readonly queueName: string;
  process(data: unknown): Promise<unknown>;
}

export const PLATFORM_JOB_PROCESSORS = Symbol('PLATFORM_JOB_PROCESSORS');
