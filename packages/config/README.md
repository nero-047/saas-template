# Nero project configuration

`@saas-template/config` defines and validates the framework-neutral description
of a Nero SaaS project. It has no filesystem or application-framework concerns.

The selected project format is `nero.config.ts`. Compared with JSON it supports
comments and imported types; compared with YAML it avoids a second parsing
syntax and implicit scalar rules. Exported types and the `defineConfig` helper
give editor completion and compile-time checking, while the same value is
strictly validated at runtime before the CLI uses it. Project-local
configuration is trusted executable code.

The internal CLI uses its isolated `jiti` loader for the trusted TypeScript
configuration, avoiding assumptions about the generated project's root module
type. This package itself performs only in-memory parsing and remains usable in
any JavaScript runtime.

Defaults intentionally describe a blank project: no applications, features, or
platform capabilities are enabled implicitly. Initializers and future generators
must make selections explicit before writing a project configuration.
