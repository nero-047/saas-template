# Internal Nero CLI

`@saas-template/cli` is the project-local Node.js runtime behind the `nero`
command. It is not the future `create-nero-saas` npm initializer. The package
loads trusted `nero.config.ts`, registers commands, inspects the workspace, and
formats terminal output; applications never depend on it.

Implemented commands:

```sh
pnpm nero info
pnpm nero doctor
```

`info` validates and displays project configuration. `doctor` checks Node,
pnpm, Nx, configuration presence, required workspace files, and `nx sync:check`.
Doctor is diagnostic only and never installs, generates, or rewrites files.

## Future positional command structure

The following commands are documented but intentionally not registered:

```text
nero dev
nero dev api
nero build
nero build web
nero db migrate
nero db seed
nero generate module
nero deploy docker
```

Project creation, generators, database dispatch, development orchestration, and
deployment remain future milestones. Positional arguments are the convention;
colon-shaped commands such as `nero dev:web` are not part of the design.
