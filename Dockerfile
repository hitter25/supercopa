# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV VITE_SUPABASE_URL=https://tdecoglljtghaulaycvd.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZWNvZ2xsanRnaGF1bGF5Y3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzIyNzcsImV4cCI6MjA4NDM0ODI3N30._r1OSfQDdJpCR0H5UFm05D1SEkYx6AVqjfWqnv0BtYc
ENV VITE_GEMINI_API_KEY=AIzaSyC9aqsYcmxXhO9yssF9dN27C3d9p6KE7HQ

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
