import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { summaryId, conceptId, selectedTextIndex, finalImageUrl } =
      await request.json();

    if (
      !summaryId ||
      !conceptId ||
      selectedTextIndex === undefined ||
      !finalImageUrl
    ) {
      return NextResponse.json(
        {
          error:
            'summaryId, conceptId, selectedTextIndex, and finalImageUrl are required',
        },
        { status: 400 }
      );
    }

    // 생성된 콘텐츠 저장
    const { data, error } = await supabase
      .from('generated_contents')
      .insert({
        summary_id: summaryId,
        concept_id: conceptId,
        prompt: 'Generated marketing content',
        image_url: finalImageUrl,
        text_options: [], // 실제로는 textOptions를 저장해야 함
        selected_text_index: selectedTextIndex,
        final_image_url: finalImageUrl,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to save content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      contentId: data.id,
    });
  } catch (error) {
    console.error('Save content API error:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}
