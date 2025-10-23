import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { conceptId, summary, concept } = await request.json();

    console.log('Generate image API - Received data:', {
      conceptId,
      summary,
      concept,
    });

    if (!conceptId || !summary || !concept) {
      return NextResponse.json(
        { error: 'conceptId, summary, and concept are required' },
        { status: 400 }
      );
    }

    // 제품 중심의 이미지 생성 프롬프트
    const imagePrompt = `Create a compelling marketing image for: ${
      summary.core_value || '제품'
    }

Product essence: ${summary.customer_benefit || '제품 설명'}
Target audience: ${summary.target_customer || '일반 사용자'}
Emotional appeal: ${summary.emotional_keyword || '긍정적'}
Unique advantage: ${summary.competitive_edge || '차별화 포인트'}

CRITICAL: ABSOLUTELY NO TEXT, WORDS, LETTERS, OR WRITTEN CONTENT OF ANY KIND IN THE IMAGE. This includes product names, titles, labels, or any readable text. Create a purely visual image using only colors, shapes, objects, and composition.`;

    // 프롬프트 로깅 추가
    console.log('=== IMAGE GENERATION PROMPT ===');
    console.log(imagePrompt);
    console.log('=== END PROMPT ===');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

    const result = await model.generateContent(imagePrompt);
    const response = await result.response;

    // 응답 정보 로깅
    console.log('=== IMAGE GENERATION RESPONSE ===');
    console.log('Response candidates:', response.candidates?.length);
    console.log(
      'First candidate finish reason:',
      response.candidates?.[0]?.finishReason
    );
    console.log(
      'Parts count:',
      response.candidates?.[0]?.content?.parts?.length
    );
    console.log('=== END RESPONSE ===');

    // Gemini 2.5 Flash Image는 실제 이미지를 생성합니다
    if (response.candidates && response.candidates[0]?.content?.parts) {
      const imagePart = response.candidates[0].content.parts.find(
        (part) => part.inlineData
      );

      if (imagePart?.inlineData) {
        const imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

        console.log('=== IMAGE GENERATION SUCCESS ===');
        console.log('Image MIME type:', imagePart.inlineData.mimeType);
        console.log('Image data length:', imagePart.inlineData.data.length);
        console.log('=== END SUCCESS ===');

        return NextResponse.json({
          imageUrl: imageUrl,
          note: 'AI generated image using Gemini 2.5 Flash Image model',
        });
      }
    }

    // 이미지 생성 실패 시 placeholder 이미지 반환
    console.log('=== IMAGE GENERATION FAILED - USING PLACEHOLDER ===');
    console.log('No image data found in response');
    console.log('=== END PLACEHOLDER ===');

    const placeholderImageUrl = `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg)"/>
        <rect x="50" y="50" width="700" height="500" fill="white" stroke="#e5e7eb" stroke-width="2" rx="8"/>
        <text x="400" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1f2937">
          AI Generated Image
        </text>
        <text x="400" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#374151">
          ${summary.title || summary.core_value || '제품'}
        </text>
        <text x="400" y="360" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
          ${summary.feature_summary || '주요 기능'}
        </text>
        <circle cx="400" cy="450" r="30" fill="#3b82f6" opacity="0.1"/>
        <text x="400" y="460" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#3b82f6">
          HYP
        </text>
      </svg>
    `
    ).toString('base64')}`;

    return NextResponse.json({
      imageUrl: placeholderImageUrl,
      note: 'Image generation failed, using placeholder image',
    });
  } catch (error) {
    console.error('=== IMAGE GENERATION ERROR ===');
    console.error('Error details:', error);
    console.error(
      'Error message:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    console.error('=== END ERROR ===');

    // 에러 시 기본 placeholder 이미지 반환
    const fallbackImageUrl = `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#fef2f2"/>
        <rect x="50" y="50" width="700" height="500" fill="#fee2e2" stroke="#fca5a5" stroke-width="2"/>
        <text x="400" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#dc2626">
          이미지 생성 실패
        </text>
        <text x="400" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#ef4444">
          기본 이미지를 사용해주세요
        </text>
      </svg>
    `
    ).toString('base64')}`;

    return NextResponse.json({
      imageUrl: fallbackImageUrl,
      error: 'Image generation failed, using fallback',
    });
  }
}
