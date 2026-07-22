export interface RequestContext {
  readonly requestId: string;
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
  requestId: string;
  userId?: string;
  organizationId?: string;
  workspaceId?: string;
  sessionId?: string;
  permissions: string[];
}

export interface ContextCarrierRequest {
  requestContext?: MutableRequestContext;
  readonly headers?: Readonly<
    Record<string, string | readonly string[] | undefined>
  >;
}
