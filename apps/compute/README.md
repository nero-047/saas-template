# Compute service

`compute` is the Python runtime for specialised processing that is better served
by the Python ecosystem, including AI/ML, documents, OCR, analytics,
forecasting, data transformation, image processing, and scientific workloads.
Those capabilities are not implemented in this foundation.

The import package is `saas_compute`. HTTP routes live in `api/`, runtime
configuration lives in `core/`, and future capabilities should be organised as
cohesive modules under `modules/` when real implementation exists. Empty module
directories are intentionally not tracked.

## Local development

From the repository root:

```sh
uv sync --project apps/compute --frozen
pnpm nx run compute:dev
```

The service listens on port 8000 and exposes only:

- `GET /health`
- `GET /ready`

Configuration uses environment variables prefixed with `COMPUTE_`, such as
`COMPUTE_ENVIRONMENT=development`. Environment settings are loaded when the
ASGI application is created to start the service, not when the package itself
is imported.

## Verification

```sh
pnpm nx run compute:lint
pnpm nx run compute:typecheck
pnpm nx run compute:test
pnpm nx run compute:build
```
