import { supabase } from './supabaseService';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Login com email/senha
 */
export async function signIn(email: string, password: string): Promise<{
  data: { user: User | null; session: Session | null } | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

/**
 * Logout
 */
export async function signOut(): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Verificar sessão atual
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Listener de mudanças de auth
 */
export function onAuthStateChange(
  callback: (user: User | null) => void
): { data: { subscription: { unsubscribe: () => void } } } {
  return supabase.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      callback(session?.user ?? null);
    }
  );
}
