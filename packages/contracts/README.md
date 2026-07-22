# API contracts

`@saas-template/contracts` is the framework-neutral source of truth for public
HTTP API definitions. The canonical source is `openapi/openapi.yaml`; application
frameworks and database models do not define cross-language contracts.

The NestJS API implements the operations defined here while retaining ownership
of business logic, authorization decisions, and runtime behavior.

The initial OpenAPI document deliberately contains no operations or business
schemas. Authentication, users, CRM, billing, and product-specific resources
will be added only when their API behavior is designed and implemented.

## Consumers

Future generated artifacts may be consumed by:

- TypeScript clients for `web`, `admin`, and `rn`.
- Dart clients and models for `flutter`.
- Python models for `compute` only when its HTTP boundary requires shared API
  schemas.

Generated clients must not be edited as source-of-truth files. Each language
will consume generated output appropriate to its own runtime; Flutter and
compute will not import TypeScript packages.

## Generation foundation

Generator implementations are intentionally absent. Future generator selection
must define reproducible versions, deterministic output locations, compatibility
with OpenAPI 3.1, and CI checks that generated files are current. Configuration
will live under `generators/` once those decisions are justified.

The only current tooling is a YAML parser used by the Nx `typecheck` target for
baseline OpenAPI structure validation. It does not generate metadata, clients,
servers, documentation, or application code.

```sh
pnpm nx run contracts:lint
pnpm nx run contracts:typecheck
```
