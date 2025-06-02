##### WARNING the docker compose does not work any more and I cannot figure out why it is not.
##### The backend keep installing dependencies for frontend even though it has package.json for backend
##### Please use npm run dev for both frontend and backend

FROM node:latest

WORKDIR /backend

# Copy package json files
COPY ./package*.json ./
RUN npm install

# Copy config files to the root
COPY ../config.*.json ../

# Copy documentations
COPY ../docs ../docs

# Copy backend file
COPY . .

# Expose port to the host
EXPOSE 5000

CMD ["npm", "run", "dev"]
