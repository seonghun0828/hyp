import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getConceptById } from '@/lib/concepts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { conceptId, summary } = await request.json();

    if (!conceptId || !summary) {
      return NextResponse.json(
        { error: 'conceptId and summary are required' },
        { status: 400 }
      );
    }

    const concept = getConceptById(conceptId);
    if (!concept) {
      return NextResponse.json(
        { error: 'Invalid concept ID' },
        { status: 400 }
      );
    }

    // 홍보 문구 생성
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `Create 2 different marketing copies for this product in Korean.
          Style: ${concept.name} - ${concept.description}
          Requirements:
          - Maximum 30 words per copy
          - Engaging and compelling
          - Match the concept style
          - Focus on key benefits
          
          Return as JSON array:
          ["copy1", "copy2"]`,
        },
        {
          role: 'user',
          content: `Product: ${summary.title}
          Description: ${summary.description}
          Features: ${summary.features.join(', ')}
          Target Users: ${summary.targetUsers.join(', ')}`,
        },
      ],
      // GPT-5-mini는 temperature 파라미터를 지원하지 않음
      ...(process.env.OPENAI_MODEL?.includes('gpt-5')
        ? {}
        : { temperature: 0.7 }),
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Failed to generate text');
    }

    let textOptions;
    try {
      textOptions = JSON.parse(aiResponse);
    } catch {
      // JSON 파싱 실패 시 기본값 사용
      textOptions = [
        `${summary.title}로 새로운 경험을 시작하세요.`,
        `${summary.title} - 당신의 일상을 바꾸는 혁신적인 솔루션.`,
      ];
    }

    // 배열이 아니거나 길이가 부족한 경우 처리
    if (!Array.isArray(textOptions) || textOptions.length < 2) {
      textOptions = [
        `${summary.title}로 새로운 경험을 시작하세요.`,
        `${summary.title} - 당신의 일상을 바꾸는 혁신적인 솔루션.`,
      ];
    }

    return NextResponse.json({
      options: textOptions.slice(0, 2), // 최대 2개만 반환
    });
  } catch (error) {
    console.error('Generate text API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate marketing text' },
      { status: 500 }
    );
  }
}
