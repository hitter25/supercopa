import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Load from .env file (local development)
    const env = loadEnv(mode, process.cwd(), '');

    // Priority: process.env (Docker/CI) > loadEnv (.env file)
    // This ensures Docker build args take precedence
    const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '';
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';
    const N8N_WEBHOOK_URL = process.env.VITE_N8N_WEBHOOK_URL || env.VITE_N8N_WEBHOOK_URL || '';

    // Log for debugging during build
    console.log('🔧 Build Environment:');
    console.log('  - GEMINI_API_KEY:', GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('  - SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('  - SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('  - N8N_WEBHOOK_URL:', N8N_WEBHOOK_URL ? 'SET' : 'NOT SET');

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(SUPABASE_ANON_KEY),
        'import.meta.env.VITE_N8N_WEBHOOK_URL': JSON.stringify(N8N_WEBHOOK_URL)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
