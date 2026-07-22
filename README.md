# SaasTemplate

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/node?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `pnpm nx graph` to visually explore what was created. Now, let's get you up to speed!

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

### API health endpoints

The API exposes `GET /health` as a process-only liveness check. It returns
`{"status":"ok"}` without contacting external services, so it remains available
when PostgreSQL is down. `GET /ready` is the traffic-readiness check: it probes
PostgreSQL with a lightweight query and returns HTTP 503 with a safe status body
when the database is unavailable.

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

- [Learn more about this workspace setup](https://nx.dev/nx-api/node?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx affected commands](https://nx.dev/ci/features/affected?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
