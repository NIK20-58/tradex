# Use Node.js 20 as the base image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app runs on
ENV SERVER_PORT=3000
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "migrate", "npm", "run", "start"] 