# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json /app/
RUN npm install

# Copy codebase and build
COPY . /app/
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for frontend routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
