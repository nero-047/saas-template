import {
  ApiClientError,
  ApiProtocolError,
  createApiClient,
  type AuthResponse,
  type FetchImplementation,
} from '../index.js';

const authResponse: AuthResponse = {
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'person@example.com',
    displayName: 'Person',
    emailVerifiedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  session: { expiresAt: '2026-02-01T00:00:00.000Z' },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': '00000000-0000-4000-8000-000000000009',
    },
  });
}

function mockFetch(): jest.MockedFunction<FetchImplementation> {
  return jest.fn() as jest.MockedFunction<FetchImplementation>;
}

describe('API client', () => {
  it('normalizes the base URL and parses a successful JSON response', async () => {
    const fetchImplementation = mockFetch().mockResolvedValue(
      jsonResponse(authResponse, 201),
    );
    const client = createApiClient({
      baseUrl: 'https://api.example.test/api/v1/',
      fetch: fetchImplementation,
    });

    await expect(
      client.register({
        email: 'person@example.com',
        password: 'long-password',
      }),
    ).resolves.toEqual({
      data: authResponse,
      requestId: '00000000-0000-4000-8000-000000000009',
      status: 201,
    });
    expect(fetchImplementation).toHaveBeenCalledWith(
      'https://api.example.test/api/v1/auth/register',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('propagates request and tenant headers', async () => {
    const fetchImplementation = mockFetch().mockResolvedValue(
      jsonResponse({ id: 'workspace' }),
    );
    const client = createApiClient({
      baseUrl: '/api/v1',
      fetch: fetchImplementation,
      headers: { 'X-Client': 'template' },
    });

    await client.getCurrentWorkspace({
      organizationId: '00000000-0000-4000-8000-000000000001',
      workspaceId: '00000000-0000-4000-8000-000000000002',
      requestId: '00000000-0000-4000-8000-000000000003',
    });

    const init = fetchImplementation.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get('X-Client')).toBe('template');
    expect(headers.get('X-Request-ID')).toBe(
      '00000000-0000-4000-8000-000000000003',
    );
    expect(headers.get('X-Organization-ID')).toBe(
      '00000000-0000-4000-8000-000000000001',
    );
    expect(headers.get('X-Workspace-ID')).toBe(
      '00000000-0000-4000-8000-000000000002',
    );
  });

  it('supports configurable cookie credential behavior', async () => {
    const fetchImplementation = mockFetch().mockResolvedValue(
      jsonResponse(authResponse),
    );
    const client = createApiClient({
      baseUrl: '/api/v1',
      credentials: 'include',
      fetch: fetchImplementation,
    });

    await client.login(
      { email: 'person@example.com', password: 'long-password' },
      { credentials: 'omit' },
    );

    expect(fetchImplementation.mock.calls[0]?.[1]?.credentials).toBe('omit');
  });

  it('handles 204 No Content without parsing JSON', async () => {
    const fetchImplementation = mockFetch().mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const client = createApiClient({
      baseUrl: '/api/v1',
      fetch: fetchImplementation,
    });

    await expect(client.logout()).resolves.toEqual({
      data: undefined,
      requestId: undefined,
      status: 204,
    });
  });

  it('parses standardized API errors', async () => {
    const errorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        details: { email: ['Invalid email.'] },
      },
      requestId: '00000000-0000-4000-8000-000000000010',
    };
    const fetchImplementation = mockFetch().mockResolvedValue(
      jsonResponse(errorResponse, 400),
    );
    const client = createApiClient({
      baseUrl: '/api/v1',
      fetch: fetchImplementation,
    });

    const promise = client.login({
      email: 'person@example.com',
      password: 'invalid-password',
    });
    await expect(promise).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { email: ['Invalid email.'] },
      message: 'Request validation failed.',
      requestId: '00000000-0000-4000-8000-000000000010',
      status: 400,
    });
    await expect(promise).rejects.toBeInstanceOf(ApiClientError);
  });

  it.each([
    ['plain text', new Response('upstream failure', { status: 502 })],
    [
      'malformed JSON',
      new Response('{broken', {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    ],
    [
      'non-standard JSON',
      jsonResponse(
        {
          error: { code: 'UPSTREAM_DETAIL', message: 'Do not trust this.' },
          requestId: '00000000-0000-4000-8000-000000000011',
        },
        502,
      ),
    ],
  ])('sanitizes %s server errors', async (_name, response) => {
    const client = createApiClient({
      baseUrl: '/api/v1',
      fetch: mockFetch().mockResolvedValue(response),
    });

    await expect(client.getCurrentUser()).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      message: `API request failed with status ${response.status}.`,
      status: response.status,
    });
  });

  it('reports malformed successful JSON as a protocol error', async () => {
    const client = createApiClient({
      baseUrl: '/api/v1',
      fetch: mockFetch().mockResolvedValue(
        new Response('{broken', { status: 200 }),
      ),
    });

    await expect(client.getCurrentUser()).rejects.toBeInstanceOf(
      ApiProtocolError,
    );
  });

  it('passes cancellation to a caller-provided fetch implementation', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    const fetchImplementation: FetchImplementation = jest.fn(
      async (_input, init) => {
        expect(init?.signal?.aborted).toBe(true);
        throw abortError;
      },
    );
    const controller = new AbortController();
    controller.abort();
    const client = createApiClient({
      baseUrl: '/api/v1',
      fetch: fetchImplementation,
    });

    await expect(
      client.getCurrentUser({ signal: controller.signal }),
    ).rejects.toBe(abortError);
    expect(fetchImplementation).toHaveBeenCalledTimes(1);
  });

  it('rejects unsafe or ambiguous base URLs', () => {
    expect(() => createApiClient({ baseUrl: '' })).toThrow(
      'API baseUrl is required.',
    );
    expect(() => createApiClient({ baseUrl: 'api/v1' })).toThrow(
      'A relative API baseUrl must start with one slash.',
    );
    expect(() =>
      createApiClient({ baseUrl: 'https://user:secret@example.test/api/v1' }),
    ).toThrow('API baseUrl must not contain credentials.');
  });
});
