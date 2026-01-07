import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'hyp_guest_credits';

// POST /api/credits/recharge
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 요청 본문 파싱 (충전할 양)
  let amount = 0;
  try {
    const body = await request.json();
    amount = body.amount;
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 로그인 유저: DB 업데이트 (paid_credits 증가)
    // 먼저 현재 크레딧 레코드가 있는지 확인
    const { data: currentData, error: fetchError } = await supabase
      .from('user_credits')
      .select('paid_credits')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching credits:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (currentData) {
      // 기존 레코드 업데이트
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({ paid_credits: (currentData.paid_credits || 0) + amount })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        return NextResponse.json(
          { error: 'Database update failed' },
          { status: 500 }
        );
      }
    } else {
      // 레코드가 없으면 생성 (일반적으로 가입 시 생성되지만 방어 코드)
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({ user_id: user.id, paid_credits: amount, free_credits: 0 });

      if (insertError) {
        console.error('Error creating credits record:', insertError);
        return NextResponse.json(
          { error: 'Database insert failed' },
          { status: 500 }
        );
      }
    }

    // 트랜잭션 기록
    await supabase.from('credit_transactions').insert({
      user_id: user.id,
      amount: amount,
      type: 'charge',
      description: 'Beta test free recharge',
    });

    return NextResponse.json({
      success: true,
      message: 'Recharged successfully',
    });
  } else {
    // 비로그인 유저: 쿠키 업데이트
    const cookieStore = await cookies();
    const currentCreditsStr = cookieStore.get(COOKIE_NAME)?.value;
    const currentCredits = currentCreditsStr
      ? parseInt(currentCreditsStr, 10)
      : 0;

    // 새 크레딧 값 계산
    const newCredits = currentCredits + amount;

    // 쿠키 설정 (httpOnly, secure)
    cookieStore.set(COOKIE_NAME, newCredits.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
    });

    return NextResponse.json({ success: true, credits: newCredits });
  }
}
