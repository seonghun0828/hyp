import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

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
          return NextResponse.json({
            id: existingData.id,
            title: existingData.title,
            core_value: existingData.core_value,
            target_customer: existingData.target_customer,
            competitive_edge: existingData.competitive_edge,
            customer_benefit: existingData.customer_benefit,
            emotional_keyword: existingData.emotional_keyword,
            feature_summary: existingData.feature_summary,
            usage_scenario: existingData.usage_scenario,
          });
        } else {
          // 캐시 미스 - AI 분석 진행
        }
      } catch (cacheError) {
        // 캐시 체크 실패 시에도 AI 분석 진행
      }
    }

    // URL에서 제품 정보 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // OpenAI로 제품 정보 요약
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a marketing copywriting assistant specialized in extracting structured product summaries.
You will receive product information (URL text).
Your task is to extract **7 key marketing summary elements** in Korean for generating promotional content later.

Follow these rules:
- Always output in JSON format (UTF-8).
- Each field must contain a concise, natural-sounding Korean sentence (under 40 words).
- If data is missing, leave the field empty (empty string "").
- Fill them only if sufficient info exists.
- Focus on how customers perceive value, not just product specs.

Required JSON structure:
{
  "title": "제품명",
  "core_value": "핵심 가치",
  "target_customer": "주요 고객층",
  "competitive_edge": "경쟁 우위",
  "customer_benefit": "고객 혜택",
  "emotional_keyword": "감정 키워드",
  "feature_summary": "주요 기능",
  "usage_scenario": "사용 시나리오"
}`,
        },
        {
          role: 'user',
          content: `Analyze this product information and extract the marketing summary elements:

${html.substring(0, 4000)}`,
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

    return NextResponse.json({
      id: summaryId,
      title: summaryData.title,
      core_value: summaryData.core_value,
      target_customer: summaryData.target_customer,
      competitive_edge: summaryData.competitive_edge,
      customer_benefit: summaryData.customer_benefit,
      emotional_keyword: summaryData.emotional_keyword,
      feature_summary: summaryData.feature_summary,
      usage_scenario: summaryData.usage_scenario,
    });
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
