import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { resultId, consent } = await request.json();

    if (!resultId) {
      return NextResponse.json(
        { error: 'resultId is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase configuration not available' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // generated_contents 테이블 업데이트
    const { error } = await supabase
      .from('generated_contents')
      .update({ is_promotional: consent })
      .eq('id', resultId);

    if (error) {
      console.error('Failed to update promotion consent:', error);
      return NextResponse.json(
        { error: 'Failed to update promotion consent' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Promotion consent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
