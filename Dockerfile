FROM node:22-slim

WORKDIR /app

# Copy package files first for better caching
COPY cbt-software/backend/package*.json ./cbt-software/backend/
RUN cd cbt-software/backend && npm install --production

# Copy the rest of the backend source
COPY cbt-software/backend/ ./cbt-software/backend/

# Change to backend directory to run the app
WORKDIR /app/cbt-software/backend

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "server.js"]
