import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { INITIAL_CREDITS } from '@/lib/constants';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? `/${locale}`;

  // locale을 포함한 리다이렉트 URL 생성
  // next가 이미 locale을 포함하고 있으면 그대로 사용, 아니면 locale 추가
  let redirectUrl = next;
  if (
    !next.startsWith(`/${locale}`) &&
    !next.startsWith('/en') &&
    !next.startsWith('/ko')
  ) {
    redirectUrl = `/${locale}${next.startsWith('/') ? '' : '/'}${next}`;
  }

  // 리다이렉트 response 생성
  const redirectResponse = NextResponse.redirect(`${origin}${redirectUrl}`);

  // Supabase 클라이언트 생성 (쿠키를 redirectResponse에 설정)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    // 쿠키에 저장된 Verifier를 사용하여 코드 교환 성공
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const userId = data.user.id;

      // code-verifier 쿠키 삭제 (더 이상 필요 없음)
      // Supabase가 생성한 모든 쿠키 중 code-verifier가 포함된 것 찾아서 삭제
      const allCookies = cookieStore.getAll();
      const codeVerifierCookie = allCookies.find((cookie) =>
        cookie.name.includes('code-verifier')
      );
      if (codeVerifierCookie) {
        redirectResponse.cookies.delete(codeVerifierCookie.name);
      }

      // anon_token 쿠키 가져오기
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
              free_credits:
                (anonCredits.free_credits || 0) + INITIAL_CREDITS.MEMBER,
              paid_credits: anonCredits.paid_credits || 0,
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

  // 성공하든 실패하든 홈(또는 next URL)으로 리다이렉트 (쿠키 포함)
  return redirectResponse;
}
