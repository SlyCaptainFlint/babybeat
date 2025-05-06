FROM node:20-slim as builder

WORKDIR /app

COPY package*.json ./
RUN npm install
# Ensure tsc is executable
RUN chmod +x ./node_modules/.bin/tsc

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html 