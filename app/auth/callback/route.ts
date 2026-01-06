import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INITIAL_CREDITS } from '@/lib/constants';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    if (!supabase) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const userId = data.user.id;

      // Check if user already has credits
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingCredits) {
        // New user: Assign initial credits defined in constants
        await supabase.from('user_credits').insert({
          user_id: userId,
          free_credits: INITIAL_CREDITS.MEMBER,
        });
      }

      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

