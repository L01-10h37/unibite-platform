## build stage ##
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml pnpm-workspace* ./

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile

COPY . .

## run stage ##
FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder --chown=nodejs:nodejs /app/app.js ./
COPY --from=builder --chown=nodejs:nodejs /app/config ./config
COPY --from=builder --chown=nodejs:nodejs /app/controllers ./controllers
COPY --from=builder --chown=nodejs:nodejs /app/middleware ./middleware
COPY --from=builder --chown=nodejs:nodejs /app/models ./models
COPY --from=builder --chown=nodejs:nodejs /app/routes ./routes
COPY --from=builder --chown=nodejs:nodejs /app/services ./services
COPY --from=builder --chown=nodejs:nodejs /app/utils ./utils
COPY --from=builder --chown=nodejs:nodejs /app/docs ./docs

USER nodejs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]