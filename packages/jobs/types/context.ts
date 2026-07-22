import { z } from 'zod';

export const jobContextSchema = z
  .object({
    requestId: z.uuid(),
    userId: z.uuid().optional(),
    organizationId: z.uuid().optional(),
    workspaceId: z.uuid().optional(),
  })
  .strict();

export type JobContext = z.infer<typeof jobContextSchema>;
