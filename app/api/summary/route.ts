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
          content: `Given the product webpage information, extract and summarize the following in Korean:
          1. Product name (if not clear from title)
          2. 3 key features (short phrases)
          3. Target users (2 short phrases)
          
          Format your response as JSON:
          {
            "title": "product name",
            "features": ["feature1", "feature2", "feature3"],
            "targetUsers": ["user1", "user2"]
          }`,
        },
        {
          role: 'user',
          content: `Title: ${title}\nDescription: ${description}\nURL: ${url}`,
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
    } catch {
      // JSON 파싱 실패 시 기본값 사용
      summaryData = {
        title: title.slice(0, 50),
        features: ['주요 기능 1', '주요 기능 2', '주요 기능 3'],
        targetUsers: ['타겟 고객 1', '타겟 고객 2'],
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
            description,
            features: summaryData.features,
            target_users: summaryData.targetUsers,
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
        } else {
          summaryId = data?.id;
        }
      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError);
      }
    }

    return NextResponse.json({
      id: summaryId,
      title: summaryData.title,
      description,
      features: summaryData.features,
      targetUsers: summaryData.targetUsers,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze product' },
      { status: 500 }
    );
  }
}
