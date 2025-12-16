import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Result ID is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    // generated_contents 테이블에서 데이터 조회
    // product_summaries 테이블과 조인하여 summary 정보도 함께 가져옴
    const { data, error } = await supabase
      .from('generated_contents')
      .select(
        `
        *,
        product_summaries (*)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch result' },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // 데이터 구조 변환
    const result = {
      generatedContent: {
        id: data.id,
        summaryId: data.summary_id,
        styles: data.concept_id ? JSON.parse(data.concept_id) : null,
        imagePrompt: data.image_prompt,
        finalImageUrl: data.image_url,
        texts: data.texts,
        selectedPrinciple: data.selected_principle,
        createdAt: data.created_at,
      },
      summary: data.product_summaries
        ? {
            id: data.product_summaries.id,
            url: data.product_summaries.url,
            title: data.product_summaries.title,
            core_value: data.product_summaries.core_value,
            target_customer: data.product_summaries.target_customer,
            competitive_edge: data.product_summaries.competitive_edge,
            customer_benefit: data.product_summaries.customer_benefit,
            emotional_keyword: data.product_summaries.emotional_keyword,
            feature_summary: data.product_summaries.feature_summary,
            usage_scenario: data.product_summaries.usage_scenario,
            category: {
              industry: data.product_summaries.category_industry,
              form: data.product_summaries.category_form,
              purpose: data.product_summaries.category_purpose,
            },
            createdAt: data.product_summaries.created_at,
          }
        : null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get result API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
