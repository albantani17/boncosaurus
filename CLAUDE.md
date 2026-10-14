# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Boncosaurus is a self-hostable personal finance app: a Bun workspace monorepo with `apps/backend` (Elysia + Drizzle ORM on PostgreSQL) and `apps/frontend` (SvelteKit 3, Svelte 5 runes, Tailwind CSS v4, `adapter-node`). The frontend has dashboard, transactions, accounts, categories, profile, and an AI assistant chat.

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
cd apps/frontend && bun test                                 # frontend unit tests (pure utils/services)
cd apps/frontend && bun run check                            # svelte-check
```

There is no linter or formatter configured. Backend code uses 2-space indentation and single quotes; the frontend uses tabs.

`bun run dev` loads the root `.env`. Frontend env vars (`API_URL`, `COOKIE_SECURE`) are declared in `apps/frontend/src/env.ts` and imported from `$app/env/private`; the SvelteKit 2 `$env/*` modules and `$lib` no longer exist.

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
- Profile endpoints live in `routes/profile.routes.ts` under `/auth/me` (prefix kept under `/auth` so the refresh cookie path still matches). `PATCH /auth/me` changes name/email; changing the email requires `currentPassword`. `POST /auth/me/password` revokes every refresh token of the user, then starts a fresh session for the caller (`authService.startSession`) and sets a new refresh cookie.
- The plugins are scoped `resolve` hooks. `authPlugin` adds `userId`. `workspacePlugin` adds `userId` and `workspaceId`: it takes the optional `X-Workspace-Id` header and checks membership, and without the header it falls back to the user's first workspace. Workspace-scoped routes `.use(workspacePlugin)`.

### Reports

`GET /reports/summary?from&to` returns income/expense totals per currency plus per-category totals for the range. Transfers are excluded and currencies are never mixed (currency comes from the transaction's account).

### AI chat

- Built on the Vercel AI SDK v7 (`ai`, `@ai-sdk/*`). v7 names differ from older docs: `instructions` (not `system`), `isStepCount`, `toUIMessageStream` + `createUIMessageStreamResponse` with `onEnd`, `createGoogle`.
- **Providers** (`ai_providers`, per workspace, managed by owner/admin) are Anthropic, OpenAI, Google, or `openai_compatible` with a `baseUrl` (Ollama, LM Studio, OpenRouter, …). One row is one model profile; one row per workspace is `isDefault`. API keys are AES-GCM encrypted with `AI_SECRET_KEY` (`utils/secret-box.ts`) and never returned; responses carry `hasApiKey`/`apiKeyHint`. Without `AI_SECRET_KEY` every AI endpoint returns `AI_NOT_CONFIGURED` (503). `utils/create-language-model.ts` maps a provider row to a model.
- **Chat** (`/chat/conversations`, private per user): the client sends only the new message; `chat.service.ts` keeps only its text, loads history from `chat_messages` (UIMessage `parts` as jsonb), saves the user message before streaming and the assistant message in `onEnd`. All message ids are server-generated UUIDv7. `result.consumeStream()` keeps saving if the browser disconnects.
- **Tools** (`services/chat-tools.ts`) read through the existing services. `proposeTransaction` only validates (`transactionService.previewTransaction`) and returns a draft; `POST …/drafts/confirm` creates the transaction with `source: 'ai'` and rewrites the stored tool output to `saved` (idempotent, serialized per draft). Tool dates must be ISO with an offset; the system prompt gives the current time in the browser's time zone.

### Startup bootstrap

`index.ts` runs `bootstrapFirstRun` before it starts listening. If the DB has no users and `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set, it creates the admin, a workspace (`WORKSPACE_NAME`, `BASE_CURRENCY`), and the default categories from `data/default-categories.ts`. It also sets a password for an existing admin that has none (the upgrade path from before auth existed).

## Frontend architecture (`apps/frontend`)

- **Import alias is `#lib/*`** (package.json `imports`), not `$lib`, and it needs the file extension: `#lib/utils/format-currency.ts`. Code that must run under `bun test` imports siblings with relative paths instead, because Bun can't resolve SvelteKit virtual modules (`$app/*`).
- **The browser never talks to the backend.** Login is a SvelteKit form action; the server stores the session in its own httpOnly cookies (`bs_access`, `bs_refresh`) and every API call is made server-side through `lib/server/api/backend.ts` (`backendFor(fetch, { accessToken, workspaceId })`). The backend's refresh token is read from its `Set-Cookie` header (`utils/read-set-cookie.ts`) and sent back as a `Cookie` header.
- **`hooks.server.ts`** fills `locals.accessToken`, refreshing through `services/refresh-coordinator.ts` when only `bs_refresh` is left. The coordinator shares one in-flight refresh per token (and caches the result for 30 s) because the backend revokes the whole token family if a refresh token is used twice.
- **Routes:** `login/` and `logout/` are public; everything under `(app)/` (`dashboard`, `transaksi`, `akun`, `kategori`, `profil`) requires a session (`(app)/+layout.server.ts` redirects to `/login` and loads `/auth/me`). The first workspace of the user is used; there is no workspace switcher yet.
- **CRUD pattern:** list pages open a `Dialog.svelte` (native `<dialog>`, bottom sheet below `md`) containing a form component (`AccountForm`, `CategoryForm`, `TransactionForm`) that posts to named actions (`?/create`, `?/update`, `?/archive`, `?/delete`). The dialog only renders its children while open, so form components read their props once (`untrack`) as initial state. Forms submit through `lib/forms/enhance-with-feedback.ts`; actions parse `FormData` with pure `utils/parse-*-form.ts` helpers and call the backend through `lib/server/services/run-backend-action.ts`. That helper maps `ApiError` codes to Indonesian messages (`utils/describe-api-error.ts`, with per-action overrides) and sends a 401 to `/login`. Action calls omit `X-Workspace-Id`, so the backend falls back to the same first workspace the layout uses.
- **Transactions page:** filters live in the URL (`month`, `type`, `accountId`, `categoryId`, read by `utils/transaction-filters.ts`). Pages are 50 rows, fetched with `limit=51` to detect more; "Muat lebih banyak" calls `transaksi/data/+server.ts` and keeps extra pages in `$state.raw` tied to the identity of `data.rows`, so any reload drops them in the same render. `?baru=1` opens the add dialog (used by the mobile "+" button). Datetimes are sent with the browser's `tzOffset` (`utils/local-datetime.ts`).
- **Assistant (`/asisten`):** `/asisten/[id]` uses `Chat` from `@ai-sdk/svelte`, created once per conversation id. `[id]/stream/+server.ts` proxies the backend's UI message stream unchanged (errors become plain text, which the transport shows). Draft cards post to `?/confirmDraft`/`?/dismissDraft` and patch `chat.messages` locally. Assistant text is rendered with `utils/parse-chat-markdown.ts` (paragraphs, lists, bold; never `{@html}`). Provider settings live at `/asisten/pengaturan`. On mobile the assistant is reached from the header, so the bottom bar keeps four items (`MOBILE_NAV_ITEMS`).
- **Dashboard data** is assembled by `lib/server/services/dashboard.service.ts` from `/accounts`, `/categories`, `/transactions` and `/reports/summary`. Month boundaries are computed in the frontend server's timezone (`TZ`). Totals are per currency and only the workspace `baseCurrency` feeds the cards; other currencies are listed separately and never converted.
- **Design tokens** come from `DESIGN.md` and live in the `@theme` block of `src/app.css` (e.g. `bg-forest-900`, `text-dino-400`). The product name stays "Boncosaurus" even though `DESIGN.md` says DinoBudget. Mascot art is pixel data in `lib/data/dino-sprites.ts`, rendered as SVG by `DinoSprite.svelte`.
- Amounts are integers in major units (no cents), formatted by `utils/format-currency.ts` (`Rp2.450.000`).

## Database conventions (`src/db/schema/`)

- Use the shared column helpers in `columns.ts`: `uuidV7Pk()` (app-generated UUIDv7), `timestamps()`, `money()` (bigint mapped to a JS `number`; amounts are positive integers), and `currencyCode()` (char(3)).
- Tenant isolation is enforced in the database. Accounts and categories have a `(workspace_id, id)` unique constraint, and transactions reference them through **composite foreign keys** on `(workspace_id, account_id)` and so on, so a row can never point into another workspace. Keep this pattern for new workspace-owned tables.
- Transaction invariants are duplicated as CHECK constraints (transfer vs non-transfer shape, positive amounts). They are a backstop for `validateTransaction`.
- Transactions are soft-deleted (`deletedAt`). Repositories must filter `isNull(deletedAt)`. Archived accounts and categories (`isArchived`) can't be newly referenced, but existing transactions that already reference them stay editable.
- New tables must be re-exported from `schema/index.ts`. Migrations are generated by drizzle-kit into `apps/backend/drizzle/` and committed; don't hand-edit the snapshots.

## Notes

- User-facing seed data and `.env.example` comments are in Indonesian, while code, identifiers, and error messages are in English.
- In Docker the frontend reaches the backend at `API_URL=http://backend:3000`. Locally it defaults to `http://localhost:3000`.
