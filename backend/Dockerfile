FROM node:latest

WORKDIR /app

# Copy package json files
COPY package*.json ./
RUN npm install

# Copy config files to the root
COPY config.*.json ../

# Copy backend file
COPY . .

# Expose port to the host
EXPOSE 5000

CMD ["npm", "run", "dev"]
