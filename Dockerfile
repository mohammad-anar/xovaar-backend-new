# Stage 1: Build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5002

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev --legacy-peer-deps && npx prisma generate

COPY --from=builder /app/dist ./dist

# Create uploads folder for storage
RUN mkdir -p uploads

EXPOSE 5002

CMD ["node", "dist/server.js"]
