import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCustomImagePrompt } from '@/lib/prompts/custom-image';
import { AI_COSTS } from '@/lib/constants';
import { checkCredits, deductCredits } from '@/lib/credits';
import { t } from '@/lib/api-messages';
import { createClient } from '@/lib/supabase/server';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { customPrompt, summary, aspectRatio, category, currentImageUrl } =
      await request.json();

    // 입력 검증
    if (!customPrompt || customPrompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Custom prompt is required' },
        { status: 400 }
      );
    }

    if (customPrompt.trim().length < 10) {
      return NextResponse.json(
        { error: 'Custom prompt must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (customPrompt.trim().length > 500) {
      return NextResponse.json(
        { error: 'Custom prompt must not exceed 500 characters' },
        { status: 400 }
      );
    }

    if (!summary) {
      return NextResponse.json(
        { error: 'Product summary is required' },
        { status: 400 }
      );
    }

    if (!currentImageUrl) {
      return NextResponse.json(
        { error: 'Current image is required for modification' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 사용자 식별
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const anonToken = request.cookies.get('anon_token')?.value;

    if (!user && !anonToken) {
      return NextResponse.json(
        { error: 'User identification required' },
        { status: 401 }
      );
    }

    const identifier = user ? { userId: user.id } : { anonToken };

    // 크레딧 체크 (50 크레딧 필요)
    const hasEnoughCredits = await checkCredits(
      identifier,
      AI_COSTS.CUSTOM_PROMPT_IMAGE,
      supabase
    );

    if (!hasEnoughCredits) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: t(request, 'insufficientCredits'),
          creditCost: AI_COSTS.CUSTOM_PROMPT_IMAGE,
        },
        { status: 402 }
      );
    }

    // 커스텀 프롬프트 생성
    const prompt = getCustomImagePrompt(
      customPrompt.trim(),
      summary,
      aspectRatio,
      category
    );

    // Extract base64 data from data URL (data:image/png;base64,...)
    const base64Match = currentImageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected data URL with base64.' },
        { status: 400 }
      );
    }
    const [, mimeType, base64Data] = base64Match;

    console.log('[Custom Image Generation] Modifying image with prompt:', {
      customPrompt: customPrompt.trim(),
      aspectRatio,
      category,
      mimeType,
    });

    // Gemini를 사용하여 이미지 수정 (multi-modal)
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }],
      config: {
        responseModalities: ["Text", "Image"],
        imageConfig: { aspectRatio: aspectRatio || '1:1' },
      },
    });

    // 응답 구조 로깅
    console.log('[Custom Image Generation] Gemini Response:', {
      hasCandidates: !!response.candidates,
      candidatesLength: response.candidates?.length || 0,
      firstCandidate: response.candidates?.[0]
        ? {
            hasContent: !!response.candidates[0].content,
            hasParts: !!response.candidates[0].content?.parts,
            partsLength: response.candidates[0].content?.parts?.length || 0,
            finishReason: response.candidates[0].finishReason,
          }
        : null,
    });

    // 이미지 데이터 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      const imagePart = response.candidates[0].content.parts.find(
        (part: any) => part.inlineData
      );

      if (imagePart?.inlineData) {
        // 크레딧 차감 (성공적으로 생성된 후)
        await deductCredits(identifier, AI_COSTS.CUSTOM_PROMPT_IMAGE, supabase);

        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

        console.log(
          '[Custom Image Generation] Successfully generated and deducted credits'
        );

        return NextResponse.json({
          success: true,
          imageUrl: imageUrl,
          imagePrompt: `[CUSTOM_MODIFIED] ${customPrompt.trim()}`,
          note: 'AI generated custom image using Gemini 2.5 Flash Image model',
        });
      }
    }

    // 이미지 생성 실패 시 에러 응답 (크레딧 차감 안 함)
    console.error('[Custom Image Generation] Failed to generate image');
    return NextResponse.json(
      {
        error: 'IMAGE_GENERATION_FAILED',
        message: t(request, 'imageGenerationFailed'),
        retryable: true,
      },
      { status: 500 }
    );
  } catch (error) {
    // 에러 시 에러 응답 반환 (크레딧 차감 안 함)
    console.error('[Custom Image Generation] Error:', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'IMAGE_GENERATION_ERROR',
        message: t(request, 'imageGenerationError'),
        retryable: true,
      },
      { status: 500 }
    );
  }
}
