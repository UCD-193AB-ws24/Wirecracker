FROM node:latest

WORKDIR /app

# Copy package json and vite config
COPY package*.json ./
COPY vite.config.js ./

# Install deps
RUN npm install

# Copy frontend files
COPY . .

# Expose port to host
EXPOSE 5173

CMD ["npm", "run", "dev"]
