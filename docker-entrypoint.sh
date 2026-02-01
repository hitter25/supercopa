#!/bin/sh

# Replace placeholders in env-config.js with actual environment variables
ENV_FILE=/usr/share/nginx/html/env-config.js

echo "🔧 Injecting environment variables..."

# Replace each placeholder with the actual value
sed -i "s|__VITE_SUPABASE_URL__|${VITE_SUPABASE_URL}|g" $ENV_FILE
sed -i "s|__VITE_SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY}|g" $ENV_FILE
sed -i "s|__VITE_GEMINI_API_KEY__|${VITE_GEMINI_API_KEY}|g" $ENV_FILE
sed -i "s|__VITE_N8N_WEBHOOK_URL__|${VITE_N8N_WEBHOOK_URL}|g" $ENV_FILE

echo "✅ Environment variables injected:"
echo "  - VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+SET}"
echo "  - VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+SET}"
echo "  - VITE_GEMINI_API_KEY: ${VITE_GEMINI_API_KEY:0:10}..."
echo "  - VITE_N8N_WEBHOOK_URL: ${VITE_N8N_WEBHOOK_URL:+SET}"

# Start nginx
echo "🚀 Starting nginx..."
exec nginx -g "daemon off;"
