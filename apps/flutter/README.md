# Flutter application

`flutter` is the isolated Flutter mobile application shell. Its Dart package is
named `saas_flutter` to avoid conflicting with Flutter's SDK package. It contains
Android and iOS projects only; desktop and web targets are intentionally absent
until the template has a concrete reason to maintain them.

## SDK and dependencies

Flutter is pinned to 3.44.6 by the exact `environment.flutter` constraint in
`pubspec.yaml`. The constraint is enforced by `flutter pub get`, and CI reads the
same file when installing Flutter. Install that SDK through your preferred local
SDK manager or from Flutter's SDK archive, then install locked dependencies:

```sh
cd apps/flutter
flutter pub get --enforce-lockfile
```

The application uses only Flutter itself, `flutter_test`, and the SDK's standard
lint rules. It has no state-management, authentication, navigation, or product
dependencies.

## Nx commands

Run these commands from the repository root:

```sh
pnpm nx run flutter:format-check
pnpm nx run flutter:analyze
pnpm nx run flutter:test
pnpm nx run flutter:build-validation
pnpm nx run flutter:run
pnpm nx run flutter:build-android
pnpm nx run flutter:build-ios
```

`build-ios` requires macOS and Xcode. Android builds require a compatible JDK
and Android SDK. The platform-independent bundle validation does not replace a
native release build or signing pipeline.

## Contract boundary

Flutter must not import TypeScript workspace packages. When the API contracts
stabilize, Dart clients and models will be generated from
`packages/contracts/openapi/openapi.yaml` into
`apps/flutter/packages/saas_api_client` rather than duplicated manually or
imported from TypeScript source. The pinned, future-only generator evaluation
is documented in `packages/contracts/generators/dart/README.md`; no Dart SDK or
Flutter dependency is added by the current foundation.
