import { createClient } from '@/lib/supabase/client';

export async function signInWithGoogle(nextPath?: string) {
  const supabase = createClient();
  const redirectTo = new URL(`${window.location.origin}/auth/callback`);
  
  if (nextPath) {
    redirectTo.searchParams.set('next', nextPath);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo.toString(),
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
