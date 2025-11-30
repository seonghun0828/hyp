import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { getSummarySystemPrompt, getSummaryUserPrompt } from '@/lib/prompts';
import { extractAndPreprocessUrl } from '@/lib/summary';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 캐시 체크 - 기존 데이터가 있는지 확인
    if (supabase) {
      try {
        const { data: existingData, error: fetchError } = await supabase
          .from('product_summaries')
          .select('*')
          .eq('url', url)
          .single();

        if (!fetchError && existingData) {
          const responseData: any = {
            id: existingData.id,
            title: existingData.title,
            core_value: existingData.core_value,
            target_customer: existingData.target_customer,
            competitive_edge: existingData.competitive_edge,
            customer_benefit: existingData.customer_benefit,
            emotional_keyword: existingData.emotional_keyword,
            feature_summary: existingData.feature_summary,
            usage_scenario: existingData.usage_scenario,
          };

          // 카테고리 정보 추가
          if (
            existingData.category_industry ||
            existingData.category_form ||
            existingData.category_purpose
          ) {
            responseData.category = {
              industry: existingData.category_industry || '',
              form: existingData.category_form || '',
              purpose: existingData.category_purpose || '',
            };
          }

          return NextResponse.json(responseData);
        } else {
          // 캐시 미스 - AI 분석 진행
        }
      } catch (cacheError) {
        // 캐시 체크 실패 시에도 AI 분석 진행
      }
    }

    // URL에서 제품 정보 가져오기 및 전처리
    const preprocessedContent = await extractAndPreprocessUrl(url);

    // OpenAI로 제품 정보 요약
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getSummarySystemPrompt(),
        },
        {
          role: 'user',
          content: getSummaryUserPrompt(preprocessedContent),
        },
      ],
      // GPT-5-mini는 temperature 파라미터를 지원하지 않음
      ...(process.env.OPENAI_MODEL?.includes('gpt-5')
        ? {}
        : { temperature: 0.3 }),
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Failed to generate summary');
    }

    let summaryData;
    try {
      summaryData = JSON.parse(aiResponse);
    } catch (parseError) {
      // JSON 파싱 실패 시 기본값 사용
      summaryData = {
        title: '',
        core_value: '',
        target_customer: '',
        competitive_edge: '',
        customer_benefit: '',
        emotional_keyword: '',
        feature_summary: '',
        usage_scenario: '',
        category: {
          industry: '',
          form: '',
          purpose: '',
        },
      };
    }

    // 카테고리 기본값 설정 (없을 경우)
    if (!summaryData.category) {
      summaryData.category = {
        industry: '',
        form: '',
        purpose: '',
      };
    }

    // Supabase에 저장 (환경 변수가 있을 때만)
    let summaryId = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('product_summaries')
          .insert({
            url,
            title: summaryData.title,
            core_value: summaryData.core_value,
            target_customer: summaryData.target_customer,
            competitive_edge: summaryData.competitive_edge,
            customer_benefit: summaryData.customer_benefit,
            emotional_keyword: summaryData.emotional_keyword,
            feature_summary: summaryData.feature_summary,
            usage_scenario: summaryData.usage_scenario,
            category_industry: summaryData.category?.industry || null,
            category_form: summaryData.category?.form || null,
            category_purpose: summaryData.category?.purpose || null,
          })
          .select()
          .single();

        if (error) {
          // 에러 발생 시에도 계속 진행
        } else {
          summaryId = data?.id;
        }
      } catch (supabaseError) {
        // Supabase 연결 에러 시에도 계속 진행
      }
    }

    const responseData: any = {
      id: summaryId,
      title: summaryData.title,
      core_value: summaryData.core_value,
      target_customer: summaryData.target_customer,
      competitive_edge: summaryData.competitive_edge,
      customer_benefit: summaryData.customer_benefit,
      emotional_keyword: summaryData.emotional_keyword,
      feature_summary: summaryData.feature_summary,
      usage_scenario: summaryData.usage_scenario,
    };

    // 카테고리 정보 추가
    if (summaryData.category) {
      responseData.category = summaryData.category;
    }

    return NextResponse.json(responseData);
  } catch (error) {
    // 에러 메시지 분석
    const errorMessage = error instanceof Error ? error.message : String(error);

    // 봇 차단 관련 에러 패턴들
    const isBotBlocked =
      errorMessage.includes('429') ||
      errorMessage.includes('Too Many Requests') ||
      errorMessage.includes('403') ||
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('bot detection') ||
      errorMessage.includes('웹사이트에 접근할 수 없습니다');

    // 서버 내부 에러 패턴들
    const isServerError =
      errorMessage.includes('Failed to generate summary') ||
      errorMessage.includes('OpenAI') ||
      errorMessage.includes('JSON.parse');

    if (isBotBlocked) {
      return NextResponse.json(
        {
          error: 'BOT_BLOCKED',
          message: '이 사이트는 봇 접근을 차단합니다. 직접 입력해주세요.',
          requiresManualInput: true,
          originalError: errorMessage,
        },
        { status: 403 }
      );
    }

    if (isServerError) {
      return NextResponse.json(
        {
          error: 'SERVER_ERROR',
          message:
            '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          retryable: true,
          originalError: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다.',
        originalError: errorMessage,
      },
      { status: 500 }
    );
  }
}
