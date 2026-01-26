FROM node:18-alpine

WORKDIR /

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose port
EXPOSE 8386

# Start the application
CMD ["node", "server.js"]
