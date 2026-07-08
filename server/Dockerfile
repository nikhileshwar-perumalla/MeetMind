# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# ---- runtime ----
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

# Run as non-root
RUN addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN mkdir -p uploads && chown -R app:app /app
USER app

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "src/index.js"]
