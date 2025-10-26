import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const summaryData = await request.json();

    if (!summaryData.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('=== SUMMARY UPDATE API - RECEIVED DATA ===');
    console.log('Summary data:', summaryData);
    console.log('=== END SUMMARY UPDATE API DATA ===');

    if (!supabase) {
      console.log('Supabase not available - skipping database save');
      return NextResponse.json({
        success: true,
        message: 'Supabase not available, data saved to localStorage only',
      });
    }

    try {
      // 기존 데이터가 있는지 확인
      const { data: existingData, error: fetchError } = await supabase
        .from('product_summaries')
        .select('id')
        .eq('url', summaryData.url)
        .single();

      let result;

      if (existingData && !fetchError) {
        // 기존 데이터 업데이트
        console.log('Updating existing summary for URL:', summaryData.url);
        const { data, error } = await supabase
          .from('product_summaries')
          .update({
            title: summaryData.title,
            core_value: summaryData.core_value,
            target_customer: summaryData.target_customer,
            competitive_edge: summaryData.competitive_edge,
            customer_benefit: summaryData.customer_benefit,
            emotional_keyword: summaryData.emotional_keyword,
            feature_summary: summaryData.feature_summary,
            usage_scenario: summaryData.usage_scenario,
          })
          .eq('url', summaryData.url)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        result = data;
        console.log('Successfully updated summary:', result);
      } else {
        // 새 데이터 생성
        console.log('Creating new summary for URL:', summaryData.url);
        const { data, error } = await supabase
          .from('product_summaries')
          .insert({
            url: summaryData.url,
            title: summaryData.title,
            core_value: summaryData.core_value,
            target_customer: summaryData.target_customer,
            competitive_edge: summaryData.competitive_edge,
            customer_benefit: summaryData.customer_benefit,
            emotional_keyword: summaryData.emotional_keyword,
            feature_summary: summaryData.feature_summary,
            usage_scenario: summaryData.usage_scenario,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase insert error:', error);
          throw error;
        }

        result = data;
        console.log('Successfully created summary:', result);
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Summary updated successfully',
      });
    } catch (supabaseError) {
      console.error('Supabase operation error:', supabaseError);
      return NextResponse.json(
        {
          error: 'Failed to save summary to database',
          details:
            supabaseError instanceof Error
              ? supabaseError.message
              : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Summary update API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process summary update request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
