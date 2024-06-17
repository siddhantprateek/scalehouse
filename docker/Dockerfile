# Use Node.js LTS version with Alpine Linux as base image
FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./

# Install npm dependencies
RUN npm install --production

# Copy the rest of the application code to the working directory
COPY . .