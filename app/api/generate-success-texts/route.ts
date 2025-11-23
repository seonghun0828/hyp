import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getMarketingTextCache, saveMarketingTextCache } from '@/lib/supabase';
import {
  getSuccessTextSystemPrompt,
  getSuccessTextUserPrompt,
} from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url, summary, styles } = await request.json();

    if (!url || !summary || !styles) {
      return NextResponse.json(
        { error: 'url, summary, and styles are required' },
        { status: 400 }
      );
    }

    // 캐시 키 생성: url_스타일조합
    const cacheKey = `${url}_${styles.messageType}_${styles.expressionStyle}_${styles.toneMood}_${styles.modelComposition}`;

    // 1. 캐시 조회
    try {
      const cachedData = await getMarketingTextCache(cacheKey);
      if (cachedData) {
        return NextResponse.json({
          texts: {
            simple: cachedData.simple,
            unexpected: cachedData.unexpected,
            concrete: cachedData.concrete,
            credible: cachedData.credible,
            emotional: cachedData.emotional,
            story: cachedData.story,
          },
          cached: true,
        });
      }
    } catch (error) {
      // 캐시 미스 - AI로 생성
    }

    // 2. 캐시 미스 - AI로 생성
    // SUCCESs 원칙에 맞는 홍보문구 생성 (하나씩)
    const principles = [
      'simple',
      'unexpected',
      'concrete',
      'credible',
      'emotional',
      'story',
    ];
    const successTexts: any = {};

    // summary에서 category 추출
    const category = summary.category;

    for (const principle of principles) {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getSuccessTextSystemPrompt(principle, styles),
          },
          {
            role: 'user',
            content: getSuccessTextUserPrompt(summary, category, styles),
          },
        ],
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) {
        successTexts[principle] = text;
      } else {
        // 기본값 사용
        const productName = summary.title || summary.core_value || '제품';
        const defaultTexts = {
          simple: `${productName}로 시작하세요.\n간단하고 명확한 솔루션입니다.`,
          unexpected: `${productName}의 놀라운 변화를 경험하세요.\n예상보다 훨씬 더 큰 효과를 얻을 수 있습니다.`,
          concrete: `${productName}로 구체적인 결과를 얻으세요.\n정확한 수치와 명확한 혜택을 확인하세요.`,
          credible: `이미 많은 사용자가 ${productName}을 선택했습니다.\n검증된 솔루션으로 안전하게 시작하세요.`,
          emotional: `${productName}과 함께하는 따뜻한 순간들.\n당신의 마음을 움직이는 특별한 경험을 선사합니다.`,
          story: `${productName}의 이야기가 시작됩니다.\n당신만의 특별한 여정을 함께 만들어가요.`,
        };
        successTexts[principle] =
          defaultTexts[principle as keyof typeof defaultTexts];
      }
    }

    // 기본값으로 빈 문구들 채우기
    const productName = summary.title || summary.core_value || '제품';
    const finalTexts = {
      simple:
        successTexts.simple ||
        `${productName}로 시작하세요.\n간단하고 명확한 솔루션입니다.`,
      unexpected:
        successTexts.unexpected ||
        `${productName}의 놀라운 변화를 경험하세요.\n예상보다 훨씬 더 큰 효과를 얻을 수 있습니다.`,
      concrete:
        successTexts.concrete ||
        `${productName}로 구체적인 결과를 얻으세요.\n정확한 수치와 명확한 혜택을 확인하세요.`,
      credible:
        successTexts.credible ||
        `이미 많은 사용자가 ${productName}을 선택했습니다.\n검증된 솔루션으로 안전하게 시작하세요.`,
      emotional:
        successTexts.emotional ||
        `${productName}과 함께하는 따뜻한 순간들.\n당신의 마음을 움직이는 특별한 경험을 선사합니다.`,
      story:
        successTexts.story ||
        `${productName}의 이야기가 시작됩니다.\n당신만의 특별한 여정을 함께 만들어가요.`,
    };

    // 3. DB에 캐시 저장
    try {
      await saveMarketingTextCache({
        cache_key: cacheKey,
        url: url,
        concept_name: `${styles.messageType}_${styles.expressionStyle}_${styles.toneMood}_${styles.modelComposition}`,
        simple: finalTexts.simple,
        unexpected: finalTexts.unexpected,
        concrete: finalTexts.concrete,
        credible: finalTexts.credible,
        emotional: finalTexts.emotional,
        story: finalTexts.story,
      });
    } catch (error) {
      // 캐시 저장 실패해도 결과는 반환
    }

    return NextResponse.json({
      texts: finalTexts,
      cached: false,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate SUCCESs marketing texts' },
      { status: 500 }
    );
  }
}
