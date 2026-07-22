# TypeScript API client

`@saas-template/api-client` provides generated request, response, operation,
and path types plus a deliberately small fetch runtime. It is framework neutral
and has no Node-only runtime dependency, so it can be used by browser, server,
and React Native code that provides standards-compatible `fetch` globals.

The client accepts an explicit base URL, cookie credential mode, default or
per-request headers, an `AbortSignal`, and an optional custom fetch
implementation. Tenant-aware methods set `X-Organization-Id` and
`X-Workspace-Id`; callers may also supply `X-Request-Id` for correlation.
HttpOnly session cookies stay owned by the user agent and API—the client does
not read or store tokens.

```ts
import { createApiClient } from '@saas-template/api-client';

const api = createApiClient({
  baseUrl: '/api/v1',
  credentials: 'include',
});

const current = await api.getCurrentWorkspace({
  organizationId,
  workspaceId,
  signal,
});
```

Non-2xx responses matching the contract become `ApiClientError`; malformed
successful responses become `ApiProtocolError`. Empty `204` responses are not
JSON-parsed. Network and abort failures retain native fetch behavior. The
client does not provide retries, application state, React hooks, secret
storage, or authentication policy.

## Development

The generated type file is committed for reproducible consumer builds:

```sh
pnpm nx run contracts:validate
pnpm nx run api-client:generate
pnpm nx run api-client:check-generated
pnpm nx run-many -t lint typecheck test build -p api-client
```

Edit only `packages/contracts/openapi/openapi.yaml`, then regenerate. CI fails
when committed output differs from deterministic generation.
