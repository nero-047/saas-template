import type {
  ErrorResponse,
  GetCurrentOrganizationData,
  GetCurrentOrganizationErrors,
  GetCurrentOrganizationResponses,
  GetCurrentUserData,
  GetCurrentUserErrors,
  GetCurrentUserResponses,
  GetCurrentWorkspaceData,
  GetCurrentWorkspaceErrors,
  GetCurrentWorkspaceResponses,
  LoginData,
  LoginErrors,
  LoginResponses,
  LogoutData,
  LogoutErrors,
  LogoutResponses,
  RegisterData,
  RegisterErrors,
  RegisterResponses,
} from '../generated/openapi.js';

export type ApiErrorCode = ErrorResponse['error']['code'];

export interface RegisterOperation {
  readonly data: RegisterData;
  readonly errors: RegisterErrors;
  readonly responses: RegisterResponses;
}

export interface LoginOperation {
  readonly data: LoginData;
  readonly errors: LoginErrors;
  readonly responses: LoginResponses;
}

export interface LogoutOperation {
  readonly data: LogoutData;
  readonly errors: LogoutErrors;
  readonly responses: LogoutResponses;
}

export interface GetCurrentUserOperation {
  readonly data: GetCurrentUserData;
  readonly errors: GetCurrentUserErrors;
  readonly responses: GetCurrentUserResponses;
}

export interface GetCurrentOrganizationOperation {
  readonly data: GetCurrentOrganizationData;
  readonly errors: GetCurrentOrganizationErrors;
  readonly responses: GetCurrentOrganizationResponses;
}

export interface GetCurrentWorkspaceOperation {
  readonly data: GetCurrentWorkspaceData;
  readonly errors: GetCurrentWorkspaceErrors;
  readonly responses: GetCurrentWorkspaceResponses;
}

export type {
  AuthResponse,
  CurrentUserResponse,
  ErrorResponse,
  LoginRequest,
  Organization,
  RegisterRequest,
  User,
  Workspace,
} from '../generated/openapi.js';
