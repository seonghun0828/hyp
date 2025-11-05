import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  getImagePromptSystemPrompt,
  getImagePromptUserPrompt,
} from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: 'summary is required' },
        { status: 400 }
      );
    }

    // core_value, emotional_keyword, usage_scenario만 사용
    const promptSummary = {
      core_value: summary.core_value,
      emotional_keyword: summary.emotional_keyword,
      usage_scenario: summary.usage_scenario,
    };

    // OpenAI로 이미지 생성 프롬프트 생성
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getImagePromptSystemPrompt(),
        },
        {
          role: 'user',
          content: getImagePromptUserPrompt(promptSummary),
        },
      ],
      ...(process.env.OPENAI_MODEL?.includes('gpt-5')
        ? {}
        : { temperature: 0.7 }),
    });

    const imagePrompt = completion.choices[0]?.message?.content?.trim();

    if (!imagePrompt) {
      return NextResponse.json(
        { error: 'Failed to generate image prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imagePrompt: imagePrompt,
    });
  } catch (error) {
    console.error('Image prompt generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image prompt' },
      { status: 500 }
    );
  }
}
