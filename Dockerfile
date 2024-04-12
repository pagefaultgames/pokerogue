# syntax=docker/dockerfile:1

ARG NODE_VERSION=${NODE_VERSION:-18.3.0}
ARG OS=${OS:-alpine}

#####################################
FROM node:${NODE_VERSION}-${OS} as build

ENV VITE_BYPASS_LOGIN=1 \
    VITE_BYPASS_TUTORIAL=0 \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .

RUN npm run build

######################################
FROM node:${NODE_VERSION}-${OS} as app

 ENV NODE_ENV=production \
     PORT=${PORT:-8000}

RUN npm install --location=global vite

USER node

WORKDIR /app

COPY --from=build /app/dist/ .
COPY --from=build /app/package.json ./package.json

EXPOSE $PORT

CMD npm run start -- --host --port $PORT