# syntax=docker/dockerfile:1
ARG NODE_VERSION=${NODE_VERSION:-22.14}
ARG OS=${OS:-alpine}

FROM node:${NODE_VERSION}-${OS}

ENV VITE_BYPASS_LOGIN=1 \
    VITE_BYPASS_TUTORIAL=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PNP_HOME=/root/.shrc \
    NODE_ENV=production \
    PORT=8000

RUN apk add --no-cache git

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY . .

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

RUN pnpm install

EXPOSE $PORT

CMD pnpm start:dev -- --host --port $PORT