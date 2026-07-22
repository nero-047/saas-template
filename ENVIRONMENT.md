# Environment-variable conventions

Environment variables belong to the application or tool that consumes them.
Example files contain safe local placeholders only. The example files
themselves are never loaded; copy the relevant example to an ignored local file
before use.

## Current variables

| Owner                | Variable               | Visibility and phase                                     | Requirement                                     |
| -------------------- | ---------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Local infrastructure | `POSTGRES_DB`          | Docker Compose runtime                                   | Optional local override                         |
| Local infrastructure | `POSTGRES_USER`        | Docker Compose runtime                                   | Optional local override                         |
| Local infrastructure | `POSTGRES_PASSWORD`    | Docker Compose runtime, secret outside local development | Optional local override                         |
| Local infrastructure | `POSTGRES_PORT`        | Docker Compose runtime                                   | Optional local override                         |
| Local infrastructure | `REDIS_PORT`           | Docker Compose runtime                                   | Optional local override                         |
| API                  | `DATABASE_URL`         | Server-only runtime                                      | Required only when a database client is created |
| API                  | `PORT`                 | Server-only process runtime                              | Optional; defaults to `3000`                    |
| Compute              | `COMPUTE_ENVIRONMENT`  | Server-only runtime                                      | Optional typed setting                          |
| Compute              | `COMPUTE_SERVICE_NAME` | Server-only runtime                                      | Optional typed setting                          |

The worker currently consumes no environment variables. Web, marketing, and
admin currently consume no application-specific environment variables.

`DRIZZLE_OUT` is a tooling-only output override used during schema generation;
it is not an application runtime setting. `NODE_ENV`, `PORT`, `HOSTNAME`, and
telemetry controls present in container definitions are operational process
settings rather than product configuration.

There are currently no browser-exposed variables. A future Next.js variable
must use `NEXT_PUBLIC_` only when its value is deliberately public. Such values
are embedded into browser bundles during `next build`; changing the container's
runtime environment does not change an already-built public value.

## Local development

Create only the local files needed for the services being run:

```sh
cp .env.example .env
cp apps/api/.env.example apps/api/.env.local
cp apps/compute/.env.example apps/compute/.env.local
```

The root `.env` configures the local PostgreSQL and Redis containers. The API
file contains its server-only database connection and process port. The compute
file contains its prefixed typed settings. No worker or Next.js example exists
until those applications have a real variable to consume.

Run applications through Nx from the repository root so project-level files
are resolved consistently. Running compute directly from `apps/compute` also
loads `.env` followed by `.env.local` through its typed settings class.

## Precedence

Values explicitly supplied by the shell, CI runner, or container orchestrator
take precedence over dotenv files.

For Nx tasks, project-local files take precedence over workspace-root files,
and `.env.local` takes precedence over `.env`. Nx also supports target- and
configuration-specific variants; the template does not create those until a
real target needs one. For direct compute execution, process variables override
`.env.local`, which overrides `.env`.

Next.js retains its standard mode-specific dotenv precedence in addition to the
process environment supplied by Nx. Server-only values must not use the
`NEXT_PUBLIC_` prefix. Public values are build-time inputs and should never
contain secrets.

All real dotenv variants, including `.env.local`, `.env.production`,
`.local.env`, and target-specific `.*.env` files, are ignored by Git and Docker
contexts. Only `.env.example` files may be tracked.

## Containers

- API receives `DATABASE_URL` and any `PORT` override at container runtime.
  Neither value is baked into the image; `/health` and image construction work
  without a database value.
- Worker currently receives no application settings. Add runtime injection only
  when a real persistent workload consumes it.
- Compute receives `COMPUTE_*` settings at container runtime. Its image keeps a
  fixed port-8000 process contract.
- Web, marketing, and admin receive server-only settings at container runtime
  when future server code needs them. Intentionally public `NEXT_PUBLIC_*`
  values must instead be supplied to their image build and declared explicitly
  in the relevant Dockerfile and workflow.

Use the deployment platform's secret/environment injection or Docker's
`--env`/`--env-file` options. Do not copy local dotenv files into images.

## Validation timing

API `PORT` is parsed at process startup and must be an integer from 1 through 65535. `DATABASE_URL` remains deliberately lazy: it is required when the
server-only database client is first created, so builds and `/health` do not
need PostgreSQL configuration. Readiness converts database failures into its
safe HTTP 503 response.

Compute settings are validated when the ASGI application is created. Invalid
`COMPUTE_ENVIRONMENT` values fail application startup. The worker and Next.js
applications have no application-specific required values to validate yet.
