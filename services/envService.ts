// Environment configuration service
// Reads from window.__ENV__ (runtime) or import.meta.env (build time)

interface EnvConfig {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GEMINI_API_KEY: string;
  VITE_N8N_WEBHOOK_URL: string;
}

// Extend Window interface
declare global {
  interface Window {
    __ENV__?: EnvConfig;
  }
}

/**
 * Get environment variable value
 * Priority: window.__ENV__ (runtime) > import.meta.env (build time)
 */
export function getEnv(key: keyof EnvConfig): string {
  // First try runtime config (injected by docker-entrypoint.sh)
  if (typeof window !== 'undefined' && window.__ENV__) {
    const value = window.__ENV__[key];
    // Check if it's not a placeholder (starts with __)
    if (value && !value.startsWith('__')) {
      return value;
    }
  }

  // Fall back to build-time config
  const buildTimeValue = import.meta.env[key];
  if (buildTimeValue) {
    return buildTimeValue;
  }

  // Return empty string if not found
  console.warn(`⚠️ Environment variable ${key} not found`);
  return '';
}

/**
 * Get all environment config
 */
export function getAllEnv(): EnvConfig {
  return {
    VITE_SUPABASE_URL: getEnv('VITE_SUPABASE_URL'),
    VITE_SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY'),
    VITE_GEMINI_API_KEY: getEnv('VITE_GEMINI_API_KEY'),
    VITE_N8N_WEBHOOK_URL: getEnv('VITE_N8N_WEBHOOK_URL'),
  };
}

/**
 * Check if a specific env var is configured
 */
export function hasEnv(key: keyof EnvConfig): boolean {
  const value = getEnv(key);
  return value !== '' && !value.startsWith('__');
}
