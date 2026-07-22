import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(1024),
});

export const organizationContextSchema = z.object({
  organizationId: z.string().uuid(),
});

export const workspaceContextSchema = organizationContextSchema.extend({
  workspaceId: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type OrganizationContextInput = z.infer<
  typeof organizationContextSchema
>;
export type WorkspaceContextInput = z.infer<typeof workspaceContextSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
