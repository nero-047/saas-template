export interface RequestContext {
  readonly userId?: string;
  readonly organizationId?: string;
  readonly workspaceId?: string;
  readonly sessionId?: string;
  readonly permissions: readonly string[];
}

export interface AuthenticatedRequestContext extends RequestContext {
  readonly userId: string;
  readonly sessionId: string;
}

export interface OrganizationRequestContext
  extends AuthenticatedRequestContext {
  readonly organizationId: string;
}

export interface WorkspaceRequestContext extends OrganizationRequestContext {
  readonly workspaceId: string;
}

export interface MutableRequestContext {
  userId?: string;
  organizationId?: string;
  workspaceId?: string;
  sessionId?: string;
  permissions: string[];
}

export interface ContextCarrierRequest {
  requestContext?: MutableRequestContext;
}
