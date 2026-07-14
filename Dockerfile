FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/
RUN npm ci --workspace=backend --include-workspace-root

COPY backend/ backend/
RUN npx prisma generate --schema=backend/prisma/schema.prisma
RUN npm run build --workspace=backend

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache tzdata openssl libssl3
ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/src/seed.ts ./src/seed.ts
COPY backend/scripts/ /app/scripts/

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/ensure-seeded.mjs && node dist/index.js"]