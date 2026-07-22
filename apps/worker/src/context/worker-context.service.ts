import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';
import type { JobContext } from '@saas-template/jobs';

@Injectable()
export class WorkerContextService {
  private readonly storage = new AsyncLocalStorage<JobContext>();

  run<T>(context: JobContext, callback: () => T): T {
    return this.storage.run({ ...context }, callback);
  }

  get(): JobContext {
    const context = this.storage.getStore();
    if (!context) {
      throw new Error('Worker execution context was not initialized.');
    }
    return { ...context };
  }

  getOptional(): JobContext | undefined {
    const context = this.storage.getStore();
    return context ? { ...context } : undefined;
  }
}
