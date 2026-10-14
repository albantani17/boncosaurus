# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Boncosaurus is a self-hostable personal finance app: a Bun workspace monorepo with `apps/backend` (Elysia + Drizzle ORM on PostgreSQL) and `apps/frontend` (SvelteKit 2/Svelte 5 runes, `adapter-node`). The frontend is still a stub that only pings `/health`; nearly all logic lives in the backend.

## Commands

Run scripts from the repo root. The only `.env` is at the root, and Bun loads `.env` from the current directory, so running backend scripts from inside `apps/backend` will not see `DATABASE_URL`/`JWT_SECRET`.

```sh
cp .env.example .env            # then set JWT_SECRET (>= 32 chars: openssl rand -base64 48)
docker compose up -d db         # Postgres only, on POSTGRES_PORT (5434 in .env.example)
bun run db:migrate              # apply migrations in apps/backend/drizzle
bun run dev                     # backend (:3000, bun --watch) + frontend (:5173) in parallel
bun run dev:be / dev:fe         # one side only
bun run db:generate             # generate a migration after editing src/db/schema/*
bun run db:studio
bun run docker:up               # full stack; backend container runs migrations on start
```

Tests and typecheck (backend tests are pure unit tests with no DB or env needed):

```sh
cd apps/backend && bun test                                  # all tests
cd apps/backend && bun test src/services/auth.service.test.ts
cd apps/backend && bun test -t "rejects a category"          # by test name
cd apps/backend && bunx tsc --noEmit                         # typecheck backend
cd apps/frontend && bun run check                            # svelte-check
```

There is no linter or formatter configured. Backend code uses 2-space indentation and single quotes; the frontend uses tabs.

## Backend architecture

Every request goes through these layers: `routes/` → `services/` → `repositories/` → `db/`.

- **`container.ts`** is the composition root. It builds every service by passing in concrete repositories, crypto helpers, `now()`, ID generators, and parsed config. Routes and plugins import services from here and never construct them.
- **Services** are factory functions (`createXService(deps)`) that depend on repository *types*, often narrowed with `Pick<…>`. They contain the business logic and throw `AppError` subclasses (`errors/app-error.ts`). They never import `db`. This is what keeps them unit-testable: `*.service.test.ts` passes in-memory fake repositories built in a `setup()` helper.
- **Repositories** are plain objects typed by an exported `XRepository` type. They are the only code that imports `db`. Every query takes `workspaceId` and filters on it.
- **Routes** are Elysia instances with a `prefix`, registered in `routes/index.ts`. Request validation uses TypeBox schemas from `schemas/` (`t.Object…`).
- **`utils/`** holds pure functions, each in its own file with a co-located `*.test.ts`. Domain rules worth knowing: `validate-transaction.ts` covers transfer shape, category/type match, archived references, and cross-currency `toAmount`. `calculate-account-balance.ts` covers balance math.
- **`types/`** derives row types from the Drizzle schema (`$inferSelect`/`$inferInsert`) along with the patch and filter types.

### Errors

`plugins/error-handler.plugin.ts` turns any `AppError` into `{ error: { code, message } }` with the error's status. Elysia validation failures become HTTP 422 with code `VALIDATION_ERROR`. Tests assert on `status`/`code`, so keep error codes stable.

### Auth and multi-tenancy

- Login returns a short-lived JWT access token (HS256 via `jose`) in the response body. The refresh token is set as an httpOnly cookie (see `utils/build-refresh-cookie.ts`). CORS uses `credentials: true` with `FRONTEND_ORIGIN`.
- Refresh tokens are stored hashed and grouped by `familyId`. Each refresh rotates the token. Reusing a revoked token, or losing the rotation race, revokes the whole family (`auth.service.ts`).
- The plugins are scoped `resolve` hooks. `authPlugin` adds `userId`. `workspacePlugin` adds `userId` and `workspaceId`: it takes the optional `X-Workspace-Id` header and checks membership, and without the header it falls back to the user's first workspace. Workspace-scoped routes `.use(workspacePlugin)`.

### Startup bootstrap

`index.ts` runs `bootstrapFirstRun` before it starts listening. If the DB has no users and `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set, it creates the admin, a workspace (`WORKSPACE_NAME`, `BASE_CURRENCY`), and the default categories from `data/default-categories.ts`. It also sets a password for an existing admin that has none (the upgrade path from before auth existed).

## Database conventions (`src/db/schema/`)

- Use the shared column helpers in `columns.ts`: `uuidV7Pk()` (app-generated UUIDv7), `timestamps()`, `money()` (bigint mapped to a JS `number`; amounts are positive integers), and `currencyCode()` (char(3)).
- Tenant isolation is enforced in the database. Accounts and categories have a `(workspace_id, id)` unique constraint, and transactions reference them through **composite foreign keys** on `(workspace_id, account_id)` and so on, so a row can never point into another workspace. Keep this pattern for new workspace-owned tables.
- Transaction invariants are duplicated as CHECK constraints (transfer vs non-transfer shape, positive amounts). They are a backstop for `validateTransaction`.
- Transactions are soft-deleted (`deletedAt`). Repositories must filter `isNull(deletedAt)`. Archived accounts and categories (`isArchived`) can't be newly referenced, but existing transactions that already reference them stay editable.
- New tables must be re-exported from `schema/index.ts`. Migrations are generated by drizzle-kit into `apps/backend/drizzle/` and committed; don't hand-edit the snapshots.

## Notes

- User-facing seed data and `.env.example` comments are in Indonesian, while code, identifiers, and error messages are in English.
- In Docker the frontend reaches the backend at `API_URL=http://backend:3000`. Locally it defaults to `http://localhost:3000`.
