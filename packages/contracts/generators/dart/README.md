# Future Dart client generation

The selected future baseline is OpenAPI Generator's `dart` generator, pinned to
7.22.0. It is mature enough to evaluate independently of the JavaScript
workspace, but its OpenAPI 3.1 and Dart feature matrix is narrower than the
TypeScript generator. `contracts:validate` therefore rejects contract features
outside the currently tested subset before a Dart SDK is introduced.

The intended output is `apps/flutter/packages/saas_api_client`. That directory
does not exist yet and Flutter does not depend on a generated SDK. When the
first Dart consumer is justified, evaluate the generated API and serialization
behavior, add Dart tests, and only then commit the generated package.

The reproducible evaluation command uses the pinned container image so Java is
not added to the pnpm or Flutter toolchain:

```sh
docker run --rm \
  -v "$PWD:/workspace" \
  openapitools/openapi-generator-cli:v7.22.0 generate \
  -g dart \
  -i /workspace/packages/contracts/openapi/openapi.yaml \
  -o /workspace/apps/flutter/packages/saas_api_client
```

This is documentation for the future workflow, not a current generation target
or CI side effect.
