import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { INITIAL_CREDITS } from '@/lib/constants';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    
    // 쿠키에 저장된 Verifier를 사용하여 코드 교환 성공
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const userId = data.user.id;
      
      // anon_token 쿠키 가져오기
      const cookieStore = await cookies();
      const anonToken = cookieStore.get('anon_token')?.value;

      // 크레딧 병합 로직
      const { data: existingCredits } = await supabase
        .from('user_credits')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingCredits) {
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
    }
  }

  // 성공하든 실패하든 홈(또는 next URL)으로 리다이렉트
  return NextResponse.redirect(`${origin}${next}`);
}
