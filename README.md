# SaasTemplate

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/node?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `pnpm nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run the dev server for your app, use:

```sh
pnpm nx serve api
```

To create a production bundle:

```sh
pnpm nx build api
```

To see all available targets to run for a project, run:

```sh
pnpm nx show project api
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Database catalogue seed

After the database schema exists, seed or reconcile the platform RBAC
catalogue with:

```sh
pnpm db:seed
```

The command requires `DATABASE_URL`. It is safe to repeat: permission and role
keys are upserted, platform grants are reconciled, and future permissions from
other namespaces are left intact. New organizations receive the same default
roles and grants atomically during registration.

### API health endpoints

The API exposes `GET /health` as a process-only liveness check. It returns
`{"status":"ok"}` without contacting external services, so it remains available
when PostgreSQL is down. `GET /ready` is the traffic-readiness check: it probes
PostgreSQL with a lightweight query and returns HTTP 503 with a safe status body
when the database is unavailable.

The initial identity runtime exposes email/password registration and login at
`/api/v1/auth/register` and `/api/v1/auth/login`. Both establish an opaque
HttpOnly session cookie; `/api/v1/auth/logout` revokes it and
`/api/v1/users/me` returns the authenticated user. PostgreSQL must be available
for these identity operations, but remains unnecessary for builds and
`/health`.

## Environment setup

Environment configuration is intentionally application-owned. For local
infrastructure and the services that currently consume settings:

```sh
cp .env.example .env
cp apps/api/.env.example apps/api/.env.local
cp apps/compute/.env.example apps/compute/.env.local
```

The root file configures local Compose services; the API and compute files are
server-only application settings. Worker, web, marketing, and admin do not have
example files because they currently consume no application variables. See
[ENVIRONMENT.md](./ENVIRONMENT.md) for precedence, browser/build-time rules,
validation timing, and container injection.

## Python compute service

`apps/compute` is the Python 3.13 runtime for specialised processing workloads.
It uses [uv](https://docs.astral.sh/uv/) for its project environment and
dependencies; it is an Nx application, not a pnpm workspace package.

Install its locked Python dependencies from the repository root:

```sh
uv sync --project apps/compute --frozen
```

Run the local service through Nx:

```sh
pnpm nx run compute:dev
```

The service listens at `http://127.0.0.1:8000` and currently exposes only
`GET /health` and `GET /ready`.

Run its verification targets with:

```sh
pnpm nx run compute:lint
pnpm nx run compute:typecheck
pnpm nx run compute:test
pnpm nx run compute:build
```

## React Native application

`apps/rn` is the minimal iOS and Android client. It uses React Native CLI with
the official Nx React Native integration; Expo and a navigation framework are
intentionally absent until an application requirement justifies them. React
Native 0.84 is used because it is the newest React Native line supported by Nx
23's integration and is compatible with the repository's Node.js 24 runtime.

Start Metro and launch a local native build with:

```sh
pnpm nx run rn:start
pnpm nx run rn:run-android
pnpm nx run rn:run-ios
```

Android development requires JDK 17 and the Android SDK. iOS development
requires macOS, Xcode, Ruby, and CocoaPods; install pods explicitly with
`pnpm nx run rn:pod-install`. Platform-independent checks are available as:

```sh
pnpm nx run-many -t lint typecheck test -p rn
pnpm nx run rn:validate-ios
pnpm nx run rn:build-android --mode=debug
```

The mobile app does not currently depend on workspace libraries. Future mobile
code may use the portable `shared`, `validation`, and `api-client` packages when
their public contracts are native-safe; it must not import the web-only `ui`
package.

## Flutter application

`apps/flutter` is an isolated Flutter mobile shell with Android and iOS native
projects. Flutter 3.44.6 is pinned in its `pubspec.yaml`; the project is not a
pnpm workspace package, while Nx still orchestrates its checks and builds.

Install its locked Dart dependencies and run validation from the repository
root:

```sh
(cd apps/flutter && flutter pub get --enforce-lockfile)
pnpm nx run-many -t format-check analyze test build-validation -p flutter
pnpm nx run flutter:build-android
pnpm nx run flutter:build-ios
```

The iOS build requires macOS and Xcode. Flutter code does not import TypeScript
workspace packages; future Dart API contracts will be generated from a
language-neutral API description.

## Production containers

Each deployable application has an independent production image. Build them
through Nx when Docker is available:

```sh
pnpm nx docker:build @saas-template/api
pnpm nx docker:build @saas-template/worker
pnpm nx docker:build web
pnpm nx docker:build marketing
pnpm nx docker:build admin
```

The API and worker images consume Nx-pruned deployment contexts. The web,
marketing, and admin images build independently and copy only their Next.js
standalone runtime, static output, and public assets into the final stage. All
Node.js containers run as the non-root `node` user.

The three Next.js images expose port 3000 and use their existing `/` pages for
container health checks. The worker exposes no port and intentionally has no
container health check: it currently has no queue consumer, scheduler, or other
persistent workload that could provide a truthful readiness signal, so CI builds
and inspects its image without starting it.

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
pnpm nx g @nx/node:app demo
```

To generate a new library, use:

```sh
pnpm nx g @nx/node:lib mylib
```

You can use `pnpm nx list` to get a list of installed plugins. Then, run `pnpm nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Continuous integration

The main CI workflow validates frozen pnpm and uv installs, Nx synchronization,
TypeScript formatting, applicable lint/typecheck/test/build targets, and offline
Drizzle generation. Pull requests use Nx affected calculation when Git base and
head commits are available; pushes to `main` use a safe all-project fallback.

The separate mobile workflow runs source checks and a Linux-compatible iOS
project configuration validation, then builds Android in an isolated job with
the required JDK and Android SDK. This keeps the main CI workflow independent of
mobile SDK setup. Native iOS compilation remains a macOS developer or release
pipeline responsibility.

Flutter has its own path-filtered workflow that installs the pinned SDK, runs
its Nx quality and bundle targets, and builds Android. The main monorepo job
explicitly excludes Flutter so unrelated CI does not provision its SDK.

The separate Docker workflow validates `compose.yaml`, starts and checks
PostgreSQL and Redis, builds all six deployable application images, inspects
their runtime users, and smoke-tests the API, compute, web, marketing, and admin
containers. It never pushes images.

Before opening a pull request, run:

```sh
pnpm install --frozen-lockfile
uv sync --project apps/compute --frozen
pnpm nx sync:check
pnpm exec prettier --check "**/*.{ts,tsx}"
pnpm nx run-many -t lint typecheck test build --all --skip-nx-cache
DRIZZLE_OUT="$(mktemp -d)" pnpm nx run db:generate
git diff --check
```

Docker is required for the complete infrastructure and image checks. Their
local equivalents start with:

```sh
docker compose config --quiet
docker compose up --detach --wait postgres redis
docker compose down --volumes --remove-orphans
```

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/node?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx affected commands](https://nx.dev/ci/features/affected?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
