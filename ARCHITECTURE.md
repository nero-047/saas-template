# Workspace architecture

## Applications

The Next.js applications live in `apps/web`, `apps/marketing`, and `apps/admin`.
Each application follows this source layout as implementation is added:

```text
src/
├── app/       # App Router routes, layouts, and route composition
├── features/  # Application-specific vertical feature modules
└── shared/    # Application-local code that is not reusable workspace-wide
```

Only `app/` exists initially because Git does not track empty directories.
Create `features/` and `shared/` when they contain real code.

The NestJS applications live in `apps/api` and `apps/worker`. The Python
specialised-processing service lives in `apps/compute` and is managed with uv.
It is represented as an Nx application but is not a pnpm workspace package and
does not import TypeScript workspace packages.

The React Native client lives in `apps/rn` and owns checked-in Android and iOS
projects. Nx's official React Native plugin orchestrates Metro, native builds,
tests, and platform tooling. The application starts as a minimal shell without
navigation, authentication, or product-specific modules.

## Service responsibilities

The NestJS API owns authentication, authorization, CRUD, transactional business
logic, public APIs, and WebSockets. Its `/health` endpoint reports process
liveness without external checks; `/ready` reports traffic readiness by probing
the mandatory PostgreSQL dependency only when requested.

The NestJS worker owns queues, notifications, scheduled business jobs, webhook
delivery, and background domain processing.

Python compute owns AI/ML, OCR, document processing, analytics, forecasting,
scientific workloads, data transformation, image processing, and other
Python-specialised or CPU/GPU-heavy processing. The foundation does not install
those capability libraries until a real workload requires them.

## Compute structure

The `saas_compute` import package keeps HTTP routes in `api/`, configuration and
cross-cutting runtime concerns in `core/`, and future processing capabilities in
cohesive modules under `modules/`. The `modules/` directory remains absent until
there is real implementation to track. Routes should validate and translate
HTTP requests while processing logic remains in capability modules.

Configuration is typed and environment-based. Importing the base package does
not read environment variables; settings are loaded when the ASGI application
is created to start the service.

## Service interaction patterns

Synchronous compute work can eventually use an internal HTTP request from the
NestJS API to compute when the operation is short enough to fit the API request
lifecycle. The API remains responsible for public contracts, authorization,
transactional decisions, and translating the compute result for clients.

Long-running work can eventually use an asynchronous workflow coordinated by
the NestJS worker. The worker remains responsible for scheduling, retries,
domain state transitions, notifications, and delivery; compute performs the
specialised processing and returns a result or failure. No additional queue,
shared Python/TypeScript schema, gRPC transport, or interaction endpoint is
introduced by this foundation.

## Package imports

Applications and packages must import workspace packages through their public
package exports, for example `@saas-template/ui` or
`@saas-template/validation`. Do not reach into `packages/*/src` with relative
imports or private subpaths.

`packages/ui` is a React TypeScript library and must remain independent of
Next.js so it can be consumed by every frontend application.

React Native is a separate UI platform and must not import `packages/ui`, which
contains web React components. It may consume the portable public APIs of
`shared`, `validation`, and `api-client` only after their dependencies and
runtime assumptions are valid on React Native. The initial shell deliberately
has no workspace-package dependencies.

## Configuration boundaries

Runtime configuration is owned and validated by the consuming application.
Server-only values never use `NEXT_PUBLIC_`; that prefix is reserved for values
intentionally embedded in browser bundles at Next.js build time. The root
dotenv example belongs to shared local infrastructure, while useful app-level
examples live beside their applications. Builds remain independent of runtime
secrets, and database configuration stays lazy until a server process first
creates a database client. Detailed precedence and container injection rules
are documented in `ENVIRONMENT.md`.

## Deployment images

API and worker deployment contexts are produced by Nx's lockfile pruning and
workspace-module copying targets. Their runtime images install production
dependencies from those contexts rather than copying the monorepo. The worker
runs as a NestJS application context, exposes no HTTP port, and has no synthetic
health check. Until a persistent queue consumer or scheduler exists, starting
it in CI would only verify that the intentionally empty process exits.

Web, marketing, and admin are built as separate Next.js standalone images. Each
image contains only its traced standalone server, generated static files, and
public assets, runs as a non-root user, and owns its own port-3000 HTTP process.
Their existing root pages provide the container liveness and CI smoke checks;
no application routes exist solely for container orchestration.

## Continuous integration and runtime ownership

GitHub Actions validates both runtime ecosystems without merging their package
management. Node.js 24, pnpm, and Nx orchestrate the TypeScript applications and
packages; Python 3.13 and uv own the compute environment. Nx may schedule both,
but JavaScript/TypeScript source must not import Python source and Python source
must not import workspace TypeScript packages.

`pnpm-lock.yaml` is the sole dependency lockfile for JavaScript and TypeScript.
`apps/compute/uv.lock` is the sole Python dependency lockfile. CI uses frozen
installs and fails if validation changes either lockfile or leaves generated
repository files behind.

The main CI workflow owns source formatting, synchronization, linting,
type-checking, tests, builds, and offline Drizzle schema generation. The Docker
workflow owns Compose validation, PostgreSQL/Redis readiness, image builds,
runtime-user inspection, and runtime smoke tests for the HTTP applications. The
worker image is build- and configuration-inspected only. Neither workflow
deploys or publishes artifacts.

The mobile workflow isolates Android SDK provisioning from main CI. It runs
React Native lint, type-check, and test targets, validates the checked-in iOS
configuration on Linux, and builds an Android debug application in a dedicated
job. Linux CI does not claim to compile iOS; a future macOS release workflow can
own Xcode compilation and signing when distribution requirements exist.
