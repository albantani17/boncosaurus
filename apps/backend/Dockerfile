FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN bun install --frozen-lockfile --filter backend

COPY apps/backend apps/backend
WORKDIR /app/apps/backend
EXPOSE 3000
CMD ["sh", "-c", "bun run db:migrate && bun run start"]
