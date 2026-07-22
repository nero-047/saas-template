# Generator policy

The OpenAPI document is the sole language-neutral source. Generator versions,
commands, and output ownership are recorded here; generated code never flows
back into the specification.

TypeScript generation uses the repository-pinned `@hey-api/openapi-ts` package
and a deterministic wrapper in `packages/api-client/scripts/generate.mjs`.
Output is checked in and CI compares a fresh in-memory generation byte-for-byte
with the committed file.

The future Dart workflow is documented in `dart/README.md`. Python generation
is deferred until compute has a concrete schema-consumption requirement.
