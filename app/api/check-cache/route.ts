import { NextRequest, NextResponse } from 'next/server';
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

    console.log('🔍 Checking cache for key:', cacheKey);

    // 캐시 조회
    const cachedData = await getMarketingTextCache(cacheKey);
    const exists = !!cachedData;

    console.log('Cache check result:', { cacheKey, exists });

    return NextResponse.json({ exists });
  } catch (error) {
    console.error('Check cache API error:', error);
    return NextResponse.json(
      { error: 'Failed to check cache' },
      { status: 500 }
    );
  }
}
