FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3002
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run dev"]
