# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --filter @hamadryad/api...

COPY apps/api ./apps/api

RUN pnpm --filter @hamadryad/api exec prisma generate
RUN pnpm --filter @hamadryad/api run build
RUN pnpm --filter @hamadryad/api deploy --prod /prod/api

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /prod/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/node_modules/.prisma ./node_modules/.prisma

ENV NODE_ENV=production
ENV API_PORT=3001

USER appuser

EXPOSE 3001

CMD ["sh", "-c", "node node_modules/.bin/prisma migrate deploy && node dist/index.js"]
