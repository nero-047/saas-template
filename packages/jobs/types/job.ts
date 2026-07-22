import { z } from 'zod';

import { jobContextSchema, type JobContext } from './context.js';

export function createJobEnvelopeSchema<TSchema extends z.ZodType>(
  payloadSchema: TSchema,
) {
  return z
    .object({
      context: jobContextSchema,
      createdAt: z.iso.datetime({ offset: true }),
      payload: payloadSchema,
    })
    .strict();
}

export interface JobEnvelope<TPayload> {
  readonly context: JobContext;
  readonly createdAt: string;
  readonly payload: TPayload;
}
