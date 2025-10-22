import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
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

    // URL에서 메타데이터 추출
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HYP-Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch URL');
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 메타데이터 추출
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      '제품명을 확인할 수 없습니다';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '제품 설명을 확인할 수 없습니다';

    // OpenAI로 제품 정보 요약
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are a marketing copywriting assistant specialized in extracting structured product summaries.
You will receive product information (URL text).
Your task is to extract **7 key marketing summary elements** in Korean for generating promotional content later.

Follow these rules:
- Always output in JSON format (UTF-8).
- Each field must contain a concise, natural-sounding Korean sentence (under 40 words).
- If data is missing, write "정보 부족".
- fill them only if sufficient info exists.
- Focus on how customers perceive value, not just product specs.`,
        },
        {
          role: 'user',
          content: `다음 제품 링크 정보를 요약해서 아래 7가지 마케팅 요소로 구조화해줘.

1. 제품 핵심 가치 (Core Value)
2. 타깃 고객 (Target Customer)
3. 주요 경쟁 우위 (Competitive Edge)
4. 고객이 느낄 이득 (Customer Benefit)
5. 감정 키워드 (Emotional Keyword)
6. 주요 기능 요약 (Feature Summary)
7. 사용 시나리오 (Usage Scenario)

Title: ${title}
Description: ${description}
URL: ${url}

반드시 다음 JSON 형식으로 응답해주세요:
{
  "core_value": "제품 핵심 가치",
  "target_customer": "타깃 고객",
  "competitive_edge": "주요 경쟁 우위",
  "customer_benefit": "고객이 느낄 이득",
  "emotional_keyword": "감정 키워드",
  "feature_summary": "주요 기능 요약",
  "usage_scenario": "사용 시나리오"
}`,
        },
      ],
      // GPT-5-mini는 temperature 파라미터를 지원하지 않음
      ...(process.env.OPENAI_MODEL?.includes('gpt-5')
        ? {}
        : { temperature: 0.3 }),
    });

    const aiResponse = completion.choices[0]?.message?.content;
    console.log('AI Response:', aiResponse);

    if (!aiResponse) {
      throw new Error('Failed to generate summary');
    }

    let summaryData;
    try {
      summaryData = JSON.parse(aiResponse);
      console.log('Parsed AI Response:', summaryData);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // JSON 파싱 실패 시 기본값 사용
      summaryData = {
        core_value: '정보 부족',
        target_customer: '정보 부족',
        competitive_edge: '정보 부족',
        customer_benefit: '정보 부족',
        emotional_keyword: '정보 부족',
        feature_summary: '정보 부족',
        usage_scenario: '정보 부족',
      };
    }

    // Supabase에 저장 (환경 변수가 있을 때만)
    let summaryId = null;
    console.log('Supabase connection check:', !!supabase);

    if (supabase) {
      try {
        console.log('Attempting to save to Supabase with data:', {
          url,
          core_value: summaryData.core_value,
          target_customer: summaryData.target_customer,
          competitive_edge: summaryData.competitive_edge,
          customer_benefit: summaryData.customer_benefit,
          emotional_keyword: summaryData.emotional_keyword,
          feature_summary: summaryData.feature_summary,
          usage_scenario: summaryData.usage_scenario,
        });

        const { data, error } = await supabase
          .from('product_summaries')
          .insert({
            url,
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
          console.error('Supabase error:', error);
        } else {
          console.log('Supabase save successful:', data);
          summaryId = data?.id;
        }
      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError);
      }
    } else {
      console.log('Supabase not available - skipping database save');
    }

    return NextResponse.json({
      id: summaryId,
      core_value: summaryData.core_value,
      target_customer: summaryData.target_customer,
      competitive_edge: summaryData.competitive_edge,
      customer_benefit: summaryData.customer_benefit,
      emotional_keyword: summaryData.emotional_keyword,
      feature_summary: summaryData.feature_summary,
      usage_scenario: summaryData.usage_scenario,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product' },
      { status: 500 }
    );
  }
}
