import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getConceptById } from '@/lib/concepts';
import { getMarketingTextCache, saveMarketingTextCache } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url, conceptName, summary, concept } = await request.json();

    if (!url || !conceptName || !summary || !concept) {
      return NextResponse.json(
        { error: 'url, conceptName, summary, and concept are required' },
        { status: 400 }
      );
    }

    // 캐시 키 생성: url_conceptName
    const cacheKey = `${url}_${conceptName}`;

    console.log('=== SUCCESS TEXTS API DEBUG ===');
    console.log('url:', url);
    console.log('conceptName:', conceptName);
    console.log('cacheKey:', cacheKey);
    console.log('=== END SUCCESS TEXTS API DEBUG ===');

    // 1. 캐시 조회
    try {
      const cachedData = await getMarketingTextCache(cacheKey);
      if (cachedData) {
        console.log('🎯 Cache HIT for key:', cacheKey);
        console.log('Cached data:', cachedData);
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
      console.log('❌ Cache MISS for key:', cacheKey);
      console.log('Cache error:', error);
    }

    // 2. 캐시 미스 - AI로 생성
    console.log('Generating new SUCCESs texts for:', cacheKey);

    const conceptData = getConceptById(concept.id);
    if (!conceptData) {
      return NextResponse.json(
        { error: 'Invalid concept ID' },
        { status: 400 }
      );
    }

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

    console.log('🎯 Starting to generate texts for principles:', principles);

    for (const principle of principles) {
      console.log(`📝 Generating text for principle: ${principle}`);

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Generate a marketing copy based on SUCCESs principle "${principle}" in Korean.
The copy should be 2-3 lines like this example:
"${conceptData.example}"

Principle: ${principle}
- Simple: Clear and concise message
- Unexpected: Surprising or counterintuitive
- Concrete: Specific and tangible
- Credible: Trustworthy with proof
- Emotional: Appeals to feelings
- Story: Narrative-driven

Style: ${conceptData.name} - ${conceptData.description}

Return only the text content, no JSON format.`,
          },
          {
            role: 'user',
            content: `Product: ${summary.core_value || '제품'}
Description: ${summary.customer_benefit || '제품 설명'}
Features: ${summary.feature_summary || '주요 기능'}
Target Users: ${summary.target_customer || '일반 사용자'}
Competitive Edge: ${summary.competitive_edge || '경쟁 우위'}`,
          },
        ],
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text) {
        successTexts[principle] = text;
        console.log(
          `✅ Generated text for ${principle}:`,
          text.substring(0, 50) + '...'
        );
      } else {
        console.log(`❌ Failed to generate text for ${principle}`);
      }
    }

    console.log('🎉 All texts generated:', Object.keys(successTexts));

    // 기본값으로 빈 문구들 채우기
    const productName = summary.title || summary.core_value || '제품';
    const defaultTexts = {
      simple: `${productName}로 시작하세요.\n간단하고 명확한 솔루션입니다.`,
      unexpected: `${productName}의 놀라운 변화를 경험하세요.\n예상보다 훨씬 더 큰 효과를 얻을 수 있습니다.`,
      concrete: `${productName}로 구체적인 결과를 얻으세요.\n정확한 수치와 명확한 혜택을 확인하세요.`,
      credible: `이미 많은 사용자가 ${productName}을 선택했습니다.\n검증된 솔루션으로 안전하게 시작하세요.`,
      emotional: `${productName}과 함께하는 따뜻한 순간들.\n당신의 마음을 움직이는 특별한 경험을 선사합니다.`,
      story: `${productName}의 이야기가 시작됩니다.\n당신만의 특별한 여정을 함께 만들어가요.`,
    };

    // 생성된 문구와 기본값 병합
    const finalTexts = { ...defaultTexts, ...successTexts };

    // 3. DB에 캐시 저장
    try {
      await saveMarketingTextCache({
        cache_key: cacheKey,
        url: url,
        concept_name: conceptName,
        simple: finalTexts.simple,
        unexpected: finalTexts.unexpected,
        concrete: finalTexts.concrete,
        credible: finalTexts.credible,
        emotional: finalTexts.emotional,
        story: finalTexts.story,
      });
      console.log('Successfully cached texts for key:', cacheKey);
    } catch (error) {
      console.error('Failed to cache texts:', error);
      // 캐시 저장 실패해도 결과는 반환
    }

    return NextResponse.json({
      texts: finalTexts,
      cached: false,
    });
  } catch (error) {
    console.error('Generate SUCCESs texts API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SUCCESs marketing texts' },
      { status: 500 }
    );
  }
}
