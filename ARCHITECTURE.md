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

## Package imports

Applications and packages must import workspace packages through their public
package exports, for example `@saas-template/ui` or
`@saas-template/validation`. Do not reach into `packages/*/src` with relative
imports or private subpaths.

`packages/ui` is a React TypeScript library and must remain independent of
Next.js so it can be consumed by every frontend application.
