import { supabase } from '@/lib/supabase';

/**
 * 현재 사용자의 크레딧을 조회합니다.
 * 로그인 유저의 경우 DB에서, 비로그인 유저의 경우 쿠키 기반 API로 조회합니다.
 */
export async function fetchUserCredits() {
  if (!supabase) throw new Error('Supabase client not initialized');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let credits = 0;

  if (user) {
    // 로그인 유저: DB 직접 조회 (RLS 활용)
    const { data } = await supabase
      .from('user_credits')
      .select('free_credits, paid_credits')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      credits = (data.free_credits || 0) + (data.paid_credits || 0);
    }
  } else {
    // 비로그인 유저: API 라우트 호출 (쿠키 기반)
    const response = await fetch('/api/credits');
    if (response.ok) {
      const data = await response.json();
      credits = data.credits;
    }
  }

  return { credits, user };
}

/**
 * 크레딧을 차감합니다.
 * @param amount 차감할 크레딧 양 (생략 시 API의 기본값 사용)
 * @param reason 차감 사유
 */
export async function deductCredits(amount: number | undefined, reason: string) {
  const body: { amount?: number; reason: string } = { reason };
  if (amount !== undefined) {
    body.amount = amount;
  }

  const response = await fetch('/api/credits/deduct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Credit deduction failed');
    (error as any).status = response.status;
    throw error;
  }

  return await response.json();
}
