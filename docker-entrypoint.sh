#!/bin/sh
set -e

# Replace placeholders in env-config.js with actual environment variables
ENV_FILE=/usr/share/nginx/html/env-config.js

echo "========================================"
echo "🔧 SuperCopa Totem - Runtime Configuration"
echo "========================================"

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE not found!"
    exit 1
fi

echo "📄 Original env-config.js:"
cat $ENV_FILE
echo ""

# Replace each placeholder with the actual value
# Using | as delimiter to avoid issues with URLs containing /
sed -i "s|__VITE_SUPABASE_URL__|${VITE_SUPABASE_URL:-}|g" $ENV_FILE
sed -i "s|__VITE_SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY:-}|g" $ENV_FILE
sed -i "s|__VITE_GEMINI_API_KEY__|${VITE_GEMINI_API_KEY:-}|g" $ENV_FILE
sed -i "s|__VITE_N8N_WEBHOOK_URL__|${VITE_N8N_WEBHOOK_URL:-}|g" $ENV_FILE

echo "✅ Environment variables injected:"
echo "  - VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:+[SET]}"
echo "  - VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+[SET]}"
echo "  - VITE_GEMINI_API_KEY: ${VITE_GEMINI_API_KEY:+[SET]}"
echo "  - VITE_N8N_WEBHOOK_URL: ${VITE_N8N_WEBHOOK_URL:+[SET]}"
echo ""

echo "📄 Final env-config.js:"
cat $ENV_FILE
echo ""

echo "========================================"
echo "🚀 Starting nginx on port 8080..."
echo "========================================"

exec nginx -g "daemon off;"
