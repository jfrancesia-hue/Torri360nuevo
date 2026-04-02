FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build shared packages first
RUN pnpm --filter @toori360/shared build
RUN pnpm --filter @toori360/db build

# Generate Prisma client
RUN pnpm --filter @toori360/db prisma generate

# Build API
RUN pnpm --filter api build

# Production stage
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-workspace.yaml ./
COPY --from=base /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/shared ./packages/shared
COPY --from=base /app/packages/db ./packages/db
COPY --from=base /app/apps/api ./apps/api
COPY --from=base /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
