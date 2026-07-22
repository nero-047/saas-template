import { z } from 'zod';

const emailSchema = z.string().trim().email().max(320);
const passwordSchema = z.string().min(12).max(1024);

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginRequestSchema = registerRequestSchema;

export const currentUserResponseSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  displayName: z.string().min(1).max(200),
  emailVerifiedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const authResponseSchema = z.object({
  user: currentUserResponseSchema,
  session: z.object({
    expiresAt: z.iso.datetime(),
  }),
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
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CurrentUserResponse = z.infer<typeof currentUserResponseSchema>;
export type OrganizationContextInput = z.infer<
  typeof organizationContextSchema
>;
export type WorkspaceContextInput = z.infer<typeof workspaceContextSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
