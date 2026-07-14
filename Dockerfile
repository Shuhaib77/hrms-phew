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
RUN apk add --no-cache tzdata
ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/prisma ./prisma

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]