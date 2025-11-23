import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getImagePrompt } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { summary, styles } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: 'summary is required' },
        { status: 400 }
      );
    }

    // prompts.ts의 getImagePrompt 함수 사용
    // summary에서 category 추출하여 전달
    const category = summary.category;
    const prompt = getImagePrompt(summary, category, styles);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Gemini 응답 구조 로깅
    console.log('[Image Generation] Gemini Response:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      firstCandidate: response.candidates?.[0]
        ? {
            hasContent: !!response.candidates[0].content,
            hasParts: !!response.candidates[0].content?.parts,
            partsLength: response.candidates[0].content?.parts?.length || 0,
            partsTypes:
              response.candidates[0].content?.parts?.map((p: any) => ({
                hasInlineData: !!p.inlineData,
                hasText: !!p.text,
                textPreview: p.text ? p.text.substring(0, 100) : null,
                inlineDataType: p.inlineData?.mimeType || null,
              })) || [],
            finishReason: response.candidates[0].finishReason,
            safetyRatings: response.candidates[0].safetyRatings,
          }
        : null,
    });

    // Gemini 2.5 Flash Image는 실제 이미지를 생성합니다
    if (response.candidates && response.candidates[0]?.content?.parts) {
      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      if (imagePart?.inlineData) {
        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

        return NextResponse.json({
          imageUrl: imageUrl,
          imagePrompt: prompt, // 사용된 프롬프트 반환
          note: 'AI generated image using Gemini 2.5 Flash Image model',
        });
      }
    }

    // 이미지 생성 실패 시 에러 응답 반환
    return NextResponse.json(
      {
        error: 'IMAGE_GENERATION_FAILED',
        message: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      },
      { status: 500 }
    );
  } catch (error) {
    // 에러 시 에러 응답 반환
    console.error('[Image Generation] Error:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'IMAGE_GENERATION_ERROR',
        message:
          '이미지 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      },
      { status: 500 }
    );
  }
}
