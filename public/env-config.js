// This file is replaced at runtime by the container entrypoint
// DO NOT put real values here - they are injected from environment variables
window.__ENV__ = {
  VITE_SUPABASE_URL: "__VITE_SUPABASE_URL__",
  VITE_SUPABASE_ANON_KEY: "__VITE_SUPABASE_ANON_KEY__",
  VITE_GEMINI_API_KEY: "__VITE_GEMINI_API_KEY__",
  VITE_N8N_WEBHOOK_URL: "__VITE_N8N_WEBHOOK_URL__"
};
