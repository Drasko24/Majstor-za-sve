# ---- Base ----
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ---- Development ----
FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- Builder ----
FROM base AS builder
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
