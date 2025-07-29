# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.14
ARG OS=alpine

FROM node:${NODE_VERSION}-${OS}

# Create non-root user for rootless operation
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install git (already present, but ensure it’s available)
RUN apk add --no-cache git

# Set environment variables
ENV VITE_BYPASS_LOGIN=1 \
    VITE_BYPASS_TUTORIAL=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    PNP_HOME=/home/appuser/.shrc \
    NODE_ENV=production \
    PORT=8000

# Set working directory
WORKDIR /app

# Enable and prepare pnpm
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy package files first for caching
COPY package.json pnpm-lock.yaml ./

# Initialize Git repository and copy .git (for submodules and lefthook)
COPY .git ./.git
COPY .gitmodules ./.gitmodules

# Install dependencies and initialize submodules
RUN --mount=type=cache,target=/home/appuser/.pnpm-store \
    git config --global --add safe.directory /app && \
    git submodule update --init --recursive && \
    pnpm install --frozen-lockfile

# Copy remaining files
COPY . .

# Change ownership for rootless compatibility
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE $PORT

# Start the app
CMD ["pnpm", "start:podman", "--", "--host", "--port", "$PORT"]