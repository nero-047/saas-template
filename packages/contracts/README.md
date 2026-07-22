# API contracts

`@saas-template/contracts` is the framework-neutral source of truth for the
public HTTP API. The canonical source is `openapi/openapi.yaml`; application
frameworks, database models, and generated clients do not define the contract.

The NestJS API implements the operations while retaining ownership of business
logic, authorization, and runtime behavior. The current contract covers only
the platform identity and tenancy foundation. Password hashes and opaque
session credentials never appear in it.

Major API versions are encoded in the server base path, beginning with
`/api/v1`. Clients may send `X-Request-Id`; responses return the accepted or
generated request identifier. Failures use the standard `ErrorResponse`
envelope.

## Validation

Validate the OpenAPI structure and the documented Dart-generation subset with:

```sh
pnpm nx run contracts:validate
pnpm nx run contracts:lint
```

Validation is offline and does not start an API, contact a database, or require
runtime secrets.

## Generated consumers

- TypeScript types and the small fetch client live in `packages/api-client` for
  web, admin, and React Native consumers. Generated TypeScript is
  committed so application builds do not need generator tooling.
- A future Dart client for Flutter will be generated into
  `apps/flutter/packages/saas_api_client`. It is intentionally not generated or
  added to Flutter dependencies yet.
- Python models may be generated for compute only when an actual compute HTTP
  boundary needs these schemas. No Python client is generated today.

Change the OpenAPI source first, regenerate TypeScript, review the semantic and
generated diffs together, and run the freshness check:

```sh
pnpm nx run api-client:generate
pnpm nx run api-client:check-generated
```

Never edit `packages/api-client/src/generated/openapi.ts` by hand.
