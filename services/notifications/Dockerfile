# ---------- base ----------
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

# ---------- deps ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URL="postgresql://user:pass@localhost:5432/dummy?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm prisma generate

RUN pnpm build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# security: non-root
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# If Prisma schema/migrations are needed at runtime (for migration jobs),
# keep prisma folder too. Not required for normal runtime.
COPY --from=build /app/prisma ./prisma

EXPOSE 3004
CMD ["node", "dist/src/main.js"]
