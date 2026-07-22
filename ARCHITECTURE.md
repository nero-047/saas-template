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

The Flutter client lives in `apps/flutter` and also owns checked-in Android and
iOS projects. It is an Nx application for orchestration but not a pnpm workspace
package. Desktop and web targets remain absent from the blank foundation to
avoid maintaining unused native surfaces.

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

## API contract ownership

The NestJS API owns business logic, authorization decisions, HTTP endpoint
implementation, and runtime behavior. `packages/contracts` owns the
language-neutral OpenAPI definition of that public HTTP surface; it does not own
framework code, persistence, or business implementation.

Clients consume generated contracts rather than redefining request and response
shapes by hand. Future TypeScript output will serve web, admin, and React Native;
Dart output will serve Flutter; Python output may serve compute when its API
boundary needs shared schemas. No generators or generated clients are included
in the current foundation.

## Identity and tenancy

An organization is the tenant boundary. Workspaces partition activity inside an
organization, while a membership connects a user to an organization and may be
restricted to one workspace:

```text
Organization
└── Workspace (optional narrower scope)
    └── Membership
        └── User
```

Organization-level memberships have no `workspace_id` and apply across that
organization. Workspace-level memberships carry both `organization_id` and
`workspace_id`; a composite foreign key guarantees that the workspace belongs
to the same organization. A user can hold both kinds of membership. A
workspace-level membership permits resolving its parent organization for
context, but does not grant access to sibling workspaces.

Every future tenant-owned domain table must contain `organization_id` and enforce
that tenant in repository queries. It may additionally contain `workspace_id`
when the record belongs to a narrower workspace scope. Cross-tenant identifiers
must be rejected at the data-access boundary rather than filtered only in UI or
controller code.

## Authentication and authorization

Email/password registration creates the user, initial organization,
organization-level membership, owner role assignment, and first session in one
database transaction. Passwords use Argon2id and the database stores only the
encoded password hash. Email lookup uses a separately normalized, uniquely
indexed value while preserving the user's display form.

Authentication uses random 256-bit opaque session credentials rather than
JWTs. Only SHA-256 token hashes are stored; active-session lookup verifies the
expiration and revocation timestamps and records last use. The raw credential
is transported in an HttpOnly, host-only cookie whose Secure, SameSite, and
expiration settings are application runtime configuration. Logout revokes the
server-side session and expires the browser cookie.

OAuth, SSO, MFA, recovery, and other credential methods can later establish the
same current-user/session abstraction without changing tenant or permission
resolution. They are intentionally absent from this minimal runtime.

Request context is resolved in stages: current user, organization membership,
then optional workspace membership. Controllers added later should translate
HTTP input only; context services and repositories enforce tenant ownership.

Authorization is role-based:

```text
Membership
└── Role
    └── Permission
```

Roles belong to one organization. Permission keys are global capabilities, and
join-table constraints prevent assigning a role to a membership from another
organization. Permission checks deny by default and require an explicit key.
The platform contract reserves `X-Organization-Id` and `X-Workspace-Id` for
tenant selection and `X-Request-Id` for correlation. Platform HTTP operations
are versioned under `/api/v1`; process health routes remain unversioned.

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

Flutter does not import TypeScript packages or duplicate their implementation.
When API contracts are mature, Dart models and clients will be generated from a
language-neutral API definition so TypeScript and Dart remain separate runtime
boundaries.

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

Flutter validation runs in its own path-filtered workflow with the exact SDK
version declared by the app. It owns Dart formatting, analysis, tests, generic
bundle validation, and an Android debug build. Main CI excludes the Flutter
project, and iOS compilation remains a macOS responsibility.
