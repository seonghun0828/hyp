import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMarketingTextCache } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { cacheKey } = await request.json();

    if (!cacheKey) {
      return NextResponse.json(
        { error: 'cacheKey is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 캐시 조회
    const cachedData = await getMarketingTextCache(cacheKey, supabase);
    const exists = !!cachedData;

    return NextResponse.json({ exists });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check cache' },
      { status: 500 }
    );
  }
}
