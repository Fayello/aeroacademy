FROM node:20-alpine AS base
RUN apk add --no-cache docker-cli docker-cli-compose
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
RUN addgroup -g 1001 -S nestjs && adduser -S nestjs -u 1001
RUN addgroup nestjs docker || addgroup -g 999 docker 2>/dev/null; adduser nestjs docker 2>/dev/null || true
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /tmp/capstone-labs && chown nestjs:nestjs /tmp/capstone-labs
USER nestjs
EXPOSE 4000
CMD ["sh", "-c", "node dist/src/main"]
