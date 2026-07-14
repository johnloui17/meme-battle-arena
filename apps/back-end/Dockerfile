# Build context is the repo root (see docker-compose.yml) so this can install
# the @meme-battle-arena/contracts workspace dependency.

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json yarn.lock .npmrc ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY apps/back-end/package.json apps/back-end/package.json
RUN yarn install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /repo
COPY package.json yarn.lock .npmrc ./
COPY --from=deps /repo/node_modules ./node_modules
COPY packages/contracts packages/contracts
COPY apps/back-end apps/back-end
RUN yarn workspace @meme-battle-arena/contracts build
RUN yarn workspace back-end build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup -S nodejs && adduser -S backend -G nodejs
COPY --from=deps /repo/node_modules ./node_modules
# yarn workspaces symlinks @meme-battle-arena/contracts to packages/contracts — replace
# the symlink with the actual built package so it resolves inside this stage.
RUN rm -rf ./node_modules/@meme-battle-arena/contracts
COPY --from=builder /repo/packages/contracts/package.json ./node_modules/@meme-battle-arena/contracts/package.json
COPY --from=builder /repo/packages/contracts/dist ./node_modules/@meme-battle-arena/contracts/dist
COPY --from=builder /repo/apps/back-end/dist ./dist
COPY apps/back-end/package.json ./package.json

USER backend
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:4000/api/v1/health || exit 1

CMD ["node", "dist/index.js"]
