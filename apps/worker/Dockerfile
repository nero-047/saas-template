# syntax=docker/dockerfile:1

FROM docker.io/node:24-alpine AS dependencies

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

COPY dist .

RUN corepack enable \
    && corepack install --global pnpm@11.10.0 \
    && pnpm install --prod --frozen-lockfile --force

FROM docker.io/node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=dependencies --chown=node:node /app /app

USER node

STOPSIGNAL SIGTERM

CMD ["node", "main.js"]
