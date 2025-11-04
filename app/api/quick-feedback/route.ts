import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, resultId, quickFeedback } = await request.json();

    if (!userId || !resultId || !quickFeedback) {
      return NextResponse.json(
        {
          error: 'userId, resultId, and quickFeedback are required',
        },
        { status: 400 }
      );
    }

    if (!['good', 'neutral', 'bad'].includes(quickFeedback)) {
      return NextResponse.json(
        {
          error: 'quickFeedback must be one of: good, neutral, bad',
        },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // 간단 피드백 저장
    const { data, error } = await supabase
      .from('quick_feedback')
      .insert({
        user_id: userId,
        result_id: resultId,
        quick_feedback: quickFeedback,
      })
      .select()
      .single();

    if (error) {
      console.error('Quick feedback API error:', error);
      return NextResponse.json(
        { error: 'Failed to save quick feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error) {
    console.error('Quick feedback API error:', error);
    return NextResponse.json(
      { error: 'Failed to save quick feedback' },
      { status: 500 }
    );
  }
}
