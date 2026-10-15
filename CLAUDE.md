# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Boncosaurus is a self-hostable personal finance app: a Bun workspace monorepo with `apps/backend` (Elysia + Drizzle ORM on PostgreSQL), `apps/frontend` (SvelteKit 3, Svelte 5 runes, Tailwind CSS v4, `adapter-node`) and `packages/shared` (`@boncosaurus/shared`, the API contract both apps import). The frontend has dashboard, transactions, accounts, categories, profile, and an AI assistant chat.

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
cd apps/backend && bun test src/services/auth/auth.service.test.ts
cd apps/backend && bun test -t "rejects a category"          # by test name
cd apps/backend && bunx tsc --noEmit                         # typecheck backend
cd apps/frontend && bun test                                 # frontend unit tests (pure utils/services)
cd apps/frontend && bun run check                            # svelte-check
cd packages/shared && bun test && bunx tsc --noEmit          # shared contract
bun test --coverage                                          # in any package; fails below 100% lines/functions
```

Each package's `bunfig.toml` sets a 100% line/function `coverageThreshold`. Bun only measures files a test imports, so repositories, routes, plugins and Svelte components are not counted. The apps ignore `packages/shared` in their coverage because shared has its own tests.

There is no linter or formatter configured. Backend and shared code use 2-space indentation and single quotes; the frontend uses tabs.

`bun run dev` loads the root `.env`. Frontend env vars (`API_URL`, `COOKIE_SECURE`) are declared in `apps/frontend/src/env.ts` and imported from `$app/env/private`; the SvelteKit 2 `$env/*` modules and `$lib` no longer exist.

## Shared package (`packages/shared`)

`@boncosaurus/shared` has no runtime dependencies and is consumed as TypeScript source (`exports: ./src/index.ts`; Bun runs it, Vite bundles it). Both Dockerfiles copy `packages/shared` before installing. It holds:

- **`constants/`**: enum tuples (`ACCOUNT_TYPES`, `TRANSACTION_TYPES`, `AI_PROVIDER_KINDS`, …) and `MIN_PASSWORD_LENGTH`. The backend builds its `pgEnum`s and TypeBox `t.UnionEnum`s from them; the frontend uses them in form parsers and selects. Changing a tuple changes a Postgres enum, so generate a migration.
- **`errors/`**: `ERROR_CODES` / `ErrorCode` (every code the backend may return), `ApiErrorBody` (`{ error: { code, message } }`), `ApiError` (frontend client error, also allows `CLIENT_ERROR_CODES` like `REQUEST_FAILED`), and `parseApiErrorBody`. `AppError` only accepts an `ErrorCode`, and the frontend's `describeApiError` map is a `Record<ErrorCode, string>`, so a new code must be added to `ERROR_CODES` and given an Indonesian message, or typecheck fails.
- **`types/`**: wire DTOs (dates as ISO strings) for responses (`AccountWithBalanceDto`, `TransactionDto`, `PeriodSummaryDto`, `ImportPreview`, `TransactionProposal`, …) and request bodies (`CreateAccountBody`, `UpdateTransactionBody`, …), plus `Jsonify`/`Assert`/`IsAssignable` helpers. Contracts are enforced at compile time in the backend: each `schemas/*.schema.ts` asserts its `Static<…>` matches the shared body type, and `types/api-contract.types.ts` asserts `Jsonify<service result>` satisfies the response DTO. The frontend `lib/types/*.types.ts` files re-export these under the names components already use (`Account`, `Transaction`, …).

## Backend architecture

Every request goes through these layers: `routes/` → `services/` → `repositories/` → `db/`. Services call pure rules in `domain/` and external libraries through `integrations/`.

- **`container.ts`** is the composition root. It builds every service by passing in concrete repositories, crypto helpers, `now()`, ID generators, and parsed config. Routes and plugins import services from here and never construct them.
- **Services** are factory functions (`createXService(deps)`) that depend on repository *types*, often narrowed with `Pick<…>`. Each feature has its own folder, even with one file (`services/account/account.service.ts`, `services/import/…`), mirroring `domain/<feature>/`. They orchestrate a use case (load, apply `domain/` rules, save) and throw `AppError` subclasses (`errors/app-error.ts`). They never import `db`. This is what keeps them unit-testable: `*.service.test.ts` passes in-memory fake repositories built in a `setup()` helper.
- **Repositories** are plain objects typed by an exported `XRepository` type. They are the only code that imports `db`. Every query takes `workspaceId` and filters on it.
- **Routes** are Elysia instances with a `prefix`, registered in `routes/index.ts`. Request validation uses TypeBox schemas from `schemas/` (`t.Object…`).
- **`domain/<feature>/`** (`transaction/`, `report/`, `import/`, `chat/`, `category/`) holds the business rules as pure functions with no I/O. It may import other `domain/` files, `types/` and `utils/`, never services, repositories, integrations or `db`.
- **`integrations/`** wraps external libraries: `ai/` (AI SDK models and provider calls), `crypto/` (password hashing, refresh tokens, `secret-box`), `files/` (CSV/XLSX/PDF extraction, with test fixtures in `files/fixtures/`).
- **`config/`** parses env into typed config (`parse-auth-config`, `parse-ai-config`, `parse-bootstrap-config`).
- **`utils/`** is only for generic helpers that know nothing about the business (`merge-defined`, `chunk-text`, `mask-secret`, …).
- Every file in these folders holds one function with a co-located `*.test.ts`. Domain rules worth knowing: `validate-transaction.ts` covers transfer shape, category/type match, archived references, and cross-currency `toAmount`. `calculate-account-balance.ts` covers balance math.
- **`types/`** derives row types from the Drizzle schema (`$inferSelect`/`$inferInsert`) along with the patch and filter types. Wire DTOs that the frontend also reads come from `@boncosaurus/shared` and are re-exported here.

### Errors

`plugins/error-handler.plugin.ts` turns any `AppError` into an `ApiErrorBody` (`{ error: { code, message } }`) with the error's status. Elysia validation failures become HTTP 422 with code `VALIDATION_ERROR`. Tests assert on `status`/`code`, so keep error codes stable.

### Logging

- `pino`, created once in `container.ts` (`logger`) from `config/parse-log-config.ts`: `LOG_LEVEL` (default `info`) and `LOG_FORMAT` (`pretty` via a synchronous `pino-pretty` stream, or `json`; defaults to `json` when `NODE_ENV=production`). `integrations/logging/create-logger.ts` redacts passwords, API keys, refresh tokens and `authorization`/`cookie` headers.
- `plugins/request-logger.plugin.ts` writes one access log line per request (`requestId`, method, path, status, `durationMs`, `userId`/`workspaceId` when resolved; `/health` is skipped) and echoes `X-Request-Id` (a safe incoming id is kept, otherwise a UUIDv7). The id lives in a `WeakMap<Request, …>` (`plugins/request-context.ts`) so `onError` can read it too.
- Errors that are not `AppError`/validation/Elysia 4xx are logged with their stack by the error handler and answered with a generic 500 `INTERNAL_ERROR`.
- Services that log take `logger: ServiceLogger` (`types/logger.types.ts`) through their deps and log with an `event` field (`auth.login_failed`, `auth.refresh_reused`, `chat.stream_failed`, `import.ai_failed`, `ai.probe_failed`, …). Tests pass `createRecordingLogger()` (`integrations/logging/`) and assert on `events()`. `db/migrate.ts` still uses `console.log` because it must not load the container.

### Auth and multi-tenancy

- Login returns a short-lived JWT access token (HS256 via `jose`) in the response body. The refresh token is set as an httpOnly cookie (see `utils/build-refresh-cookie.ts`). CORS uses `credentials: true` with `FRONTEND_ORIGIN`.
- Refresh tokens are stored hashed and grouped by `familyId`. Each refresh rotates the token. Reusing a revoked token, or losing the rotation race, revokes the whole family (`auth.service.ts`).
- Profile endpoints live in `routes/profile.routes.ts` under `/auth/me` (prefix kept under `/auth` so the refresh cookie path still matches). `PATCH /auth/me` changes name/email; changing the email requires `currentPassword`. `POST /auth/me/password` revokes every refresh token of the user, then starts a fresh session for the caller (`authService.startSession`) and sets a new refresh cookie.
- The plugins are scoped `resolve` hooks. `authPlugin` adds `userId`. `workspacePlugin` adds `userId` and `workspaceId`: it takes the optional `X-Workspace-Id` header and checks membership, and without the header it falls back to the user's first workspace. Workspace-scoped routes `.use(workspacePlugin)`.

### Reports

`GET /reports/summary?from&to` returns income/expense totals per currency plus per-category totals for the range. Transfers are excluded and currencies are never mixed (currency comes from the transaction's account). The one exception is a transfer's optional `fee` (admin fee, transfers only, in the source account currency): it reduces the source balance (`amount + fee`) and is counted as an uncategorized expense (`domain/report/add-transfer-fees.ts`).

### AI chat

- Built on the Vercel AI SDK v7 (`ai`, `@ai-sdk/*`). v7 names differ from older docs: `instructions` (not `system`), `isStepCount`, `toUIMessageStream` + `createUIMessageStreamResponse` with `onEnd`, `createGoogle`.
- **Providers** (`ai_providers`, per workspace, managed by owner/admin) are Anthropic, OpenAI, Google, or `openai_compatible` with a `baseUrl` (Ollama, LM Studio, OpenRouter, …). One row is one model profile; one row per workspace is `isDefault`. API keys are AES-GCM encrypted with `AI_SECRET_KEY` (`integrations/crypto/secret-box.ts`) and never returned; responses carry `hasApiKey`/`apiKeyHint`. Without `AI_SECRET_KEY` every AI endpoint returns `AI_NOT_CONFIGURED` (503). `integrations/ai/create-language-model.ts` maps a provider row to a model.
- **Chat** (`/chat/conversations`, private per user): the client sends only the new message; `chat.service.ts` keeps only its text, loads history from `chat_messages` (UIMessage `parts` as jsonb), saves the user message before streaming and the assistant message in `onEnd`. All message ids are server-generated UUIDv7. `result.consumeStream()` keeps saving if the browser disconnects.
- **Tools** (`services/chat/chat-tools.ts`) read through the existing services. `proposeTransaction` only validates (`transactionService.previewTransaction`) and returns a draft; `POST …/drafts/confirm` creates the transaction with `source: 'ai'` and rewrites the stored tool output to `saved` (idempotent, serialized per draft). Tool dates must be ISO with an offset; the system prompt gives the current time in the browser's time zone.

### Import

`POST /imports/preview` (multipart: `file`, `timeZone`, `utcOffsetMinutes`) is stateless and returns a draft; `POST /imports/commit` (JSON) re-validates everything and writes in one DB transaction (`import.repository.ts`), with `source: 'import'`. Formats: CSV/TSV (`papaparse`), XLSX (`read-excel-file`), PDF with text (`unpdf`), JSON/TXT; at most 5 MB and 2000 rows.
- `import-preview.service.ts`: `integrations/files/extract-*` → `ExtractedContent`. For tables the AI only sees the header plus ~25 rows and returns a `ColumnMapping` that `apply-column-mapping.ts` applies to every row; text is chunked and the AI extracts transactions per chunk. Missing categories are filled by one AI call per batch of unique descriptions. `build-import-rows.ts` then matches accounts/categories by name (unmatched ones become "create new" drafts), flags duplicates (`detect-duplicates.ts`, one-to-one against existing transactions) and validates each row with `validateTransaction`. Prompts treat file content as data (`build-import-system-prompt.ts`); AI calls live in `import-ai.ts` (`Output.object` + zod).
- `import-commit.service.ts` resolves the account/category drafts (an `accountId`/`categoryId` maps to an existing record, a name collision reuses the existing one), generates ids for new ones, and rejects the whole batch if any row is invalid.
- Frontend: `transaksi/impor` has three steps (upload → review → result) driven by the `?/preview` and `?/commit` actions. `ImportReview.svelte` keeps row selection and account/category mapping client-side and submits `buildCommitPayload(...)` as one JSON field. `create-backend-client.ts` passes `FormData` through untouched. The frontend container needs `BODY_SIZE_LIMIT` (adapter-node defaults to 512 KB).

### Startup bootstrap

`index.ts` runs `bootstrapFirstRun` before it starts listening. If the DB has no users and `ADMIN_EMAIL`/`ADMIN_PASSWORD` are set, it creates the admin, a workspace (`WORKSPACE_NAME`, `BASE_CURRENCY`), and the default categories from `data/default-categories.ts`. It also sets a password for an existing admin that has none (the upgrade path from before auth existed).

## Frontend architecture (`apps/frontend`)

- **Import alias is `#lib/*`** (package.json `imports`), not `$lib`, and it needs the file extension: `#lib/utils/format-currency.ts`. Code that must run under `bun test` imports siblings with relative paths instead, because Bun can't resolve SvelteKit virtual modules (`$app/*`).
- **`src/lib` layout** mirrors the backend: `domain/<feature>/` holds pure business rules (form parsing, filters, category tree, chat markdown, API error messages) and never imports components, services, `server/` or `$app`; `utils/` is only generic helpers (formatting, dates, `is-uuid`, `read-form-text`). `components/<feature>/` groups components by feature, with shared building blocks in `components/ui/`, the shell in `components/layout/` and pixel art in `components/mascot/`. Server code lives in `server/api/` (backend client), `server/services/<feature>/` and `server/actions/` (form action helpers). `data/` and `types/` stay flat, one file per topic.
- **The browser never talks to the backend.** Login is a SvelteKit form action; the server stores the session in its own httpOnly cookies (`bs_access`, `bs_refresh`) and every API call is made server-side through `lib/server/api/backend.ts` (`backendFor(fetch, { accessToken, workspaceId })`; `get<T>`/`send<T>` return parsed JSON, `request` returns the raw `Response`, and non-2xx responses throw an `ApiError` built by `parseApiErrorBody`). The backend's refresh token is read from its `Set-Cookie` header (`utils/read-set-cookie.ts`) and sent back as a `Cookie` header.
- **`hooks.server.ts`** fills `locals.accessToken`, refreshing through `server/services/auth/refresh-coordinator.ts` when only `bs_refresh` is left. The coordinator shares one in-flight refresh per token (and caches the result for 30 s) because the backend revokes the whole token family if a refresh token is used twice.
- **Routes:** `login/` and `logout/` are public; everything under `(app)/` (`dashboard`, `transaksi`, `akun`, `kategori`, `profil`) requires a session (`(app)/+layout.server.ts` redirects to `/login` and loads `/auth/me`). The first workspace of the user is used; there is no workspace switcher yet.
- **CRUD pattern:** list pages open a `Dialog.svelte` (native `<dialog>`, bottom sheet below `md`) containing a form component (`AccountForm`, `CategoryForm`, `TransactionForm`) that posts to named actions (`?/create`, `?/update`, `?/archive`, `?/delete`). The dialog only renders its children while open, so form components read their props once (`untrack`) as initial state. Forms submit through `lib/forms/enhance-with-feedback.ts`; actions parse `FormData` with pure `domain/<feature>/parse-*-form.ts` helpers and call the backend through `lib/server/actions/run-backend-action.ts`. That helper maps `ApiError` codes (from `@boncosaurus/shared`) to Indonesian messages (`domain/error/describe-api-error.ts`, with per-action overrides) and sends a 401 to `/login`. Action calls omit `X-Workspace-Id`, so the backend falls back to the same first workspace the layout uses.
- **Transactions page:** filters live in the URL (`month`, `type`, `accountId`, `categoryId`, read by `domain/transaction/transaction-filters.ts`). Pages are 50 rows, fetched with `limit=51` to detect more; "Muat lebih banyak" calls `transaksi/data/+server.ts` and keeps extra pages in `$state.raw` tied to the identity of `data.rows`, so any reload drops them in the same render. `?baru=1` opens the add dialog (used by the mobile "+" button). Datetimes are sent with the browser's `tzOffset` (`utils/local-datetime.ts`).
- **Assistant (`/asisten`):** `(app)/+layout.svelte` renders `/asisten*` full-bleed. `asisten/+layout.svelte` adds `ChatSidebar` (new chat link, history, Pengaturan AI) next to the app sidebar; its open state lives in `lib/state/chat-panel.svelte.ts` (context; desktop state in `localStorage`, mobile drawer closes on navigation) and `ChatPanelToggle` flips it. `asisten/+layout.server.ts` loads providers and conversations (`depends('app:conversations')`) for every assistant page. `/asisten` is an empty chat: the first message is kept by `services/chat/pending-chat-message.ts`, `?/new` creates the conversation and redirects, and `/asisten/[id]` sends it on mount. `/asisten/[id]` uses `Chat` from `@ai-sdk/svelte`, created once per conversation id. `[id]/stream/+server.ts` proxies the backend's UI message stream unchanged (errors become plain text, which the transport shows). Draft cards post to `?/confirmDraft`/`?/dismissDraft` and patch `chat.messages` locally. Assistant text is rendered with `domain/chat/parse-chat-markdown.ts` (paragraphs, lists, bold; never `{@html}`). Both chat pages use `ChatShell` (full-height, own scroller, `ChatBackdrop` pixel scenery from `data/chat-backdrop-sprites.ts`). On mobile the assistant is reached from the header, so the bottom bar keeps four items (`MOBILE_NAV_ITEMS`).
- **Dashboard data** is assembled by `lib/server/services/dashboard/dashboard.service.ts` from `/accounts`, `/categories`, `/transactions` and `/reports/summary`. Month boundaries are computed in the frontend server's timezone (`TZ`). Totals are per currency and only the workspace `baseCurrency` feeds the cards; other currencies are listed separately and never converted.
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
