##### WARNING the docker compose does not work any more and I cannot figure out why it is not.
##### The backend keep installing dependencies for frontend even though it has package.json for backend
##### Please use npm run dev for both frontend and backend

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
