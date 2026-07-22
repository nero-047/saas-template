# Database migrations

This directory contains the ordered, reviewable PostgreSQL schema history for
`@saas-template/db`.

- `migrations/*.sql` contains structural database changes generated from the
  Drizzle TypeScript schema.
- `migrations/meta/` contains Drizzle Kit's snapshot and migration journal.

Drizzle Kit requires the SQL files and its `meta` directory to share one
configured migration root. The project therefore uses `drizzle/migrations` as
that root; moving `meta` to `drizzle/meta` would make generation and migration
application incompatible with the installed Drizzle Kit version.

Generate a migration after intentionally changing the schema:

```sh
pnpm db:check
pnpm db:generate -- --name=<descriptive_name>
```

`db:check` validates the existing journal without connecting to PostgreSQL.
Review both the generated SQL and metadata before committing them. Apply all
pending migrations to the database selected by `DATABASE_URL` with:

```sh
pnpm db:migrate
```

Migrations own database structure only. Run `pnpm db:seed` separately to
upsert the platform permission catalogue, organization roles, and explicit
role grants. Neither migration generation nor normal builds require a database
connection.
