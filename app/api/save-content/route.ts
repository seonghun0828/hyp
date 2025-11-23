import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const {
      summaryId,
      styles,
      selectedPrinciple,
      texts,
      imagePrompt,
      finalImageUrl,
    } = await request.json();

    if (
      !summaryId ||
      !styles ||
      !selectedPrinciple ||
      !Array.isArray(texts) ||
      !imagePrompt ||
      !finalImageUrl
    ) {
      return NextResponse.json(
        {
          error:
            'summaryId, styles, selectedPrinciple, texts, imagePrompt, and finalImageUrl are required',
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

    // 생성된 콘텐츠 저장
    // styles를 JSON 문자열로 저장 (DB 스키마에 styles 컬럼이 있다고 가정)
    const { data, error } = await supabase
      .from('generated_contents')
      .insert({
        summary_id: summaryId,
        concept_id: JSON.stringify(styles), // 임시로 concept_id에 저장 (나중에 스키마 변경 필요)
        image_prompt: imagePrompt,
        image_url: finalImageUrl,
        texts: texts,
        selected_principle: selectedPrinciple,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
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
