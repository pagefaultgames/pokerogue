# syntax=docker/dockerfile:1
# SPDX-FileCopyrightText: 2025 Pagefault Games
# SPDX-FileContributor: domagoj03
#
# SPDX-License-Identifier: AGPL-3.0-only
ARG NODE_VERSION=22.14
ARG OS=alpine

FROM node:${NODE_VERSION}-${OS}

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install git (for potential runtime needs)
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Enable and prepare pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

COPY . .

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN --mount=type=cache,target=/home/appuser/.pnpm-store \
    pnpm install --frozen-lockfile && \
    rm -rf /home/appuser/.pnpm-store/*

# Change ownership
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment variables
ENV VITE_BYPASS_LOGIN=1 \
    VITE_BYPASS_TUTORIAL=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PNP_HOME=/home/appuser/.shrc \
    NODE_ENV=development \
    PORT=8000

# Expose port
EXPOSE $PORT

# Start the app in development mode
CMD ["pnpm", "run", "start:podman"]
