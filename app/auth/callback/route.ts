import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { INITIAL_CREDITS } from '@/lib/constants';

export async function GET(request: NextRequest) {
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
      const anonToken = request.cookies.get('anon_token')?.value;

      // Check if user already has credits
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingCredits) {
        // User has no credits yet. Check for anon credits to merge.
        let anonCredits = null;
        if (anonToken) {
          const { data } = await supabase
            .from('user_credits')
            .select('*')
            .eq('anon_token', anonToken)
            .maybeSingle();
          anonCredits = data;
        }

        if (anonCredits) {
          // Convert Anon -> Member (Add 5 credits to existing balance)
          await supabase
            .from('user_credits')
            .update({
              user_id: userId,
              anon_token: null, // Clear anon token
              free_credits: (anonCredits.free_credits || 0) + INITIAL_CREDITS.MEMBER,
              paid_credits: (anonCredits.paid_credits || 0),
            })
            .eq('id', anonCredits.id);
        } else {
          // New User, No Anon History
          await supabase.from('user_credits').insert({
            user_id: userId,
            free_credits: INITIAL_CREDITS.MEMBER,
          });
        }
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

