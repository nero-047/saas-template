import type {
  ApiErrorCode,
  AuthResponse,
  CurrentUserResponse,
  ErrorResponse,
  LoginRequest,
  Organization,
  RegisterRequest,
  Workspace,
} from './types.js';

export type ApiHeaders = Readonly<Record<string, string>>;

export type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export interface ApiClientOptions {
  readonly baseUrl: string;
  readonly credentials?: RequestCredentials;
  readonly fetch?: FetchImplementation;
  readonly headers?: ApiHeaders;
}

export interface RequestOptions {
  readonly credentials?: RequestCredentials;
  readonly headers?: ApiHeaders;
  readonly requestId?: string;
  readonly signal?: AbortSignal;
}

export interface OrganizationRequestOptions extends RequestOptions {
  readonly organizationId: string;
}

export interface WorkspaceRequestOptions extends OrganizationRequestOptions {
  readonly workspaceId: string;
}

export interface ApiResult<TData> {
  readonly data: TData;
  readonly requestId?: string;
  readonly status: number;
}

const API_ERROR_CODES: Readonly<Record<ApiErrorCode, true>> = {
  AUTH_REQUIRED: true,
  CONFLICT: true,
  FORBIDDEN: true,
  INTERNAL_ERROR: true,
  INVALID_CREDENTIALS: true,
  NOT_FOUND: true,
  SERVICE_UNAVAILABLE: true,
  VALIDATION_ERROR: true,
};

export class ApiClientError extends Error {
  readonly code: ApiErrorCode | 'HTTP_ERROR';
  readonly details?: unknown;
  readonly requestId?: string;
  readonly status: number;

  constructor(options: {
    readonly code: ApiErrorCode | 'HTTP_ERROR';
    readonly details?: unknown;
    readonly message: string;
    readonly requestId?: string;
    readonly status: number;
  }) {
    super(options.message);
    this.name = 'ApiClientError';
    this.code = options.code;
    this.details = options.details;
    this.requestId = options.requestId;
    this.status = options.status;
  }
}

export class ApiProtocolError extends Error {
  readonly requestId?: string;
  readonly status: number;

  constructor(status: number, requestId?: string) {
    super('The API returned an invalid response.');
    this.name = 'ApiProtocolError';
    this.requestId = requestId;
    this.status = status;
  }
}

export interface ApiClient {
  register(
    request: RegisterRequest,
    options?: RequestOptions,
  ): Promise<ApiResult<AuthResponse>>;
  login(
    request: LoginRequest,
    options?: RequestOptions,
  ): Promise<ApiResult<AuthResponse>>;
  logout(options?: RequestOptions): Promise<ApiResult<void>>;
  getCurrentUser(
    options?: RequestOptions,
  ): Promise<ApiResult<CurrentUserResponse>>;
  getCurrentOrganization(
    options: OrganizationRequestOptions,
  ): Promise<ApiResult<Organization>>;
  getCurrentWorkspace(
    options: WorkspaceRequestOptions,
  ): Promise<ApiResult<Workspace>>;
}

function normalizeBaseUrl(value: string): string {
  const baseUrl = value.trim();
  if (!baseUrl) {
    throw new Error('API baseUrl is required.');
  }
  if (baseUrl.includes('?') || baseUrl.includes('#')) {
    throw new Error('API baseUrl must not contain a query or fragment.');
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(baseUrl)) {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('API baseUrl must use HTTP or HTTPS.');
    }
    if (parsed.username || parsed.password) {
      throw new Error('API baseUrl must not contain credentials.');
    }
  } else if (!baseUrl.startsWith('/') || baseUrl.startsWith('//')) {
    throw new Error('A relative API baseUrl must start with one slash.');
  }

  return baseUrl === '/' ? '' : baseUrl.replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    isRecord(value) &&
    typeof value.requestId === 'string' &&
    isRecord(value.error) &&
    typeof value.error.code === 'string' &&
    value.error.code in API_ERROR_CODES &&
    typeof value.error.message === 'string' &&
    (value.error.details === undefined || isRecord(value.error.details))
  );
}

function parseJson(value: string): unknown | undefined {
  if (!value.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

class FetchApiClient implements ApiClient {
  private readonly baseUrl: string;
  private readonly credentials: RequestCredentials;
  private readonly fetchImplementation: FetchImplementation;
  private readonly headers: ApiHeaders;

  constructor(options: ApiClientOptions) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
    this.credentials = options.credentials ?? 'same-origin';
    const fetchImplementation = options.fetch ?? globalThis.fetch;
    if (!fetchImplementation) {
      throw new Error('A fetch implementation is required.');
    }
    this.fetchImplementation = fetchImplementation.bind(globalThis);
    this.headers = { ...options.headers };
  }

  register(
    request: RegisterRequest,
    options?: RequestOptions,
  ): Promise<ApiResult<AuthResponse>> {
    return this.request('/auth/register', 'POST', options, request);
  }

  login(
    request: LoginRequest,
    options?: RequestOptions,
  ): Promise<ApiResult<AuthResponse>> {
    return this.request('/auth/login', 'POST', options, request);
  }

  logout(options?: RequestOptions): Promise<ApiResult<void>> {
    return this.request('/auth/logout', 'POST', options, undefined, true);
  }

  getCurrentUser(
    options?: RequestOptions,
  ): Promise<ApiResult<CurrentUserResponse>> {
    return this.request('/users/me', 'GET', options);
  }

  getCurrentOrganization(
    options: OrganizationRequestOptions,
  ): Promise<ApiResult<Organization>> {
    return this.request('/organizations/current', 'GET', options);
  }

  getCurrentWorkspace(
    options: WorkspaceRequestOptions,
  ): Promise<ApiResult<Workspace>> {
    return this.request('/workspaces/current', 'GET', options);
  }

  private async request<TData>(
    path: string,
    method: 'GET' | 'POST',
    options: RequestOptions | undefined,
    body?: unknown,
    noContent = false,
  ): Promise<ApiResult<TData>> {
    const headers = new Headers(this.headers);
    for (const [name, value] of Object.entries(options?.headers ?? {})) {
      headers.set(name, value);
    }
    headers.set('Accept', 'application/json');
    if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    if (options?.requestId) {
      headers.set('X-Request-Id', options.requestId);
    }
    if ('organizationId' in (options ?? {})) {
      headers.set(
        'X-Organization-Id',
        (options as OrganizationRequestOptions).organizationId,
      );
    }
    if ('workspaceId' in (options ?? {})) {
      headers.set(
        'X-Workspace-Id',
        (options as WorkspaceRequestOptions).workspaceId,
      );
    }

    const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
      method,
      headers,
      credentials: options?.credentials ?? this.credentials,
      signal: options?.signal,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const requestId = response.headers.get('X-Request-Id') ?? undefined;

    if (response.status === 204 && response.ok) {
      return { data: undefined as TData, requestId, status: response.status };
    }

    const parsed = parseJson(await response.text());
    if (!response.ok) {
      if (isErrorResponse(parsed)) {
        throw new ApiClientError({
          code: parsed.error.code,
          details: parsed.error.details,
          message: parsed.error.message,
          requestId: parsed.requestId,
          status: response.status,
        });
      }
      throw new ApiClientError({
        code: 'HTTP_ERROR',
        message: `API request failed with status ${response.status}.`,
        requestId,
        status: response.status,
      });
    }
    if (noContent || parsed === undefined) {
      throw new ApiProtocolError(response.status, requestId);
    }
    return { data: parsed as TData, requestId, status: response.status };
  }
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  return new FetchApiClient(options);
}
