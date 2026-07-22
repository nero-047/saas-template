# syntax=docker/dockerfile:1

FROM docker.io/node:24-alpine AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /workspace

RUN corepack enable \
    && corepack install --global pnpm@11.10.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/marketing/package.json apps/marketing/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/validation/package.json packages/validation/package.json

RUN pnpm install --frozen-lockfile \
    --filter @saas-template/source \
    --filter @saas-template/admin...

FROM dependencies AS builder

ENV NEXT_TELEMETRY_DISABLED=1

COPY . .

RUN mkdir -p apps/admin/public \
    && pnpm nx run admin:build --skip-nx-cache

FROM docker.io/node:24-alpine AS runtime

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

COPY --from=builder --chown=node:node /workspace/apps/admin/.next/standalone ./
COPY --from=builder --chown=node:node /workspace/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=node:node /workspace/apps/admin/public ./apps/admin/public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || '3000') + '/', { signal: AbortSignal.timeout(2000) }).then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/admin/server.js"]
