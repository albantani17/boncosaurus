FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN bun install --frozen-lockfile --filter frontend
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
WORKDIR /app/apps/frontend
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=build /app/apps/frontend/build ./build
COPY --from=build /app/apps/frontend/package.json ./
ENV PORT=3000 HOST=0.0.0.0
EXPOSE 3000
CMD ["bun", "build/index.js"]
