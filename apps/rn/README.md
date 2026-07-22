# React Native application

`rn` is the native iOS and Android application shell. It uses React Native CLI,
Metro, TypeScript, and the official Nx React Native integration. Expo,
navigation, authentication, and product features are intentionally absent.

## Local development

Install the locked workspace dependencies from the repository root, then start
Metro:

```sh
pnpm install --frozen-lockfile
pnpm nx run rn:start
```

In another terminal, run the desired platform:

```sh
pnpm nx run rn:run-android
pnpm nx run rn:pod-install
pnpm nx run rn:run-ios
```

Android development requires JDK 17 and the Android SDK/NDK versions declared
by the generated Gradle project. iOS development and compilation require macOS,
Xcode, Ruby, and CocoaPods. `pod-install` is explicit so a JavaScript dependency
install does not mutate the native project or require macOS.

## Validation

```sh
pnpm nx run rn:lint
pnpm nx run rn:typecheck
pnpm nx run rn:test
pnpm nx run rn:build-android --mode=debug
pnpm nx run rn:validate-ios
```

The iOS validation target checks the committed Podfile, Xcode project, shared
scheme, application delegate, and property list on any operating system. It is
not a substitute for an Xcode build; Linux CI intentionally does not attempt
one.

The native app may consume `@saas-template/shared`,
`@saas-template/validation`, and `@saas-template/api-client` when their APIs are
platform-neutral. It must not import the web-only `@saas-template/ui` package.
