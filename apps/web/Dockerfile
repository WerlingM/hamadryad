# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile --filter @hamadryad/web...

COPY apps/web ./apps/web

RUN pnpm --filter @hamadryad/web run build

# ── Stage 2: nginx runner ─────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

RUN rm /etc/nginx/conf.d/default.conf

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
