import { createClient } from '@/lib/supabase/client';
import { locales } from '@/i18n';

export async function signInWithGoogle(nextPath?: string) {
  const supabase = createClient();
  
  // pathname에서 locale 추출 (예: /en/editor -> en)
  let locale = 'en'; // 기본값
  if (nextPath) {
    const pathParts = nextPath.split('/').filter(Boolean);
    if (pathParts.length > 0 && locales.includes(pathParts[0] as any)) {
      locale = pathParts[0];
    }
  } else {
    // pathname이 없으면 현재 URL에서 locale 추출
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean);
    if (pathParts.length > 0 && locales.includes(pathParts[0] as any)) {
      locale = pathParts[0];
    }
  }
  
  const redirectTo = new URL(`${window.location.origin}/${locale}/auth/callback`);
  
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
