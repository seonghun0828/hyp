import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { deductCredits } from '@/lib/credits';
import { AI_COSTS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const { amount, reason } = await request.json();

    // 토큰 확인
    const anonToken = request.cookies.get('anon_token')?.value;
    
    // 로그인 유저 확인
    let userId: string | undefined;
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId && !anonToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 기본적으로 이미지 생성 비용 사용 (요청된 비용이 없으면)
    const cost = amount || AI_COSTS.IMAGE_GENERATION;

    try {
      await deductCredits({ userId, anonToken }, cost);
      return NextResponse.json({ success: true, deducted: cost });
    } catch (error) {
      // 크레딧 부족 에러 처리
      if (error instanceof Error && error.message === 'Insufficient credits') {
        return NextResponse.json(
          { error: 'INSUFFICIENT_CREDITS', message: '크레딧이 부족합니다.' },
          { status: 402 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('[Credit Deduction] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}

