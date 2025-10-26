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

    // 1. 캐시 조회
    try {
      const cachedData = await getMarketingTextCache(cacheKey);
      if (cachedData) {
        // 캐시된 데이터를 SSE로 스트리밍
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const principles = [
              'simple',
              'unexpected',
              'concrete',
              'credible',
              'emotional',
              'story',
            ];

            principles.forEach((principle, index) => {
              const text = cachedData[principle];
              const data = JSON.stringify({
                principle,
                text,
                completed: index + 1,
                total: principles.length,
                cached: true,
              });

              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            });

            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        });
      }
    } catch (error) {
      // 캐시 미스 - AI로 생성 (SSE 스트리밍)
    }

    const conceptData = getConceptById(concept.id);
    if (!conceptData) {
      return NextResponse.json(
        { error: 'Invalid concept ID' },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const principles = [
          'simple',
          'unexpected',
          'concrete',
          'credible',
          'emotional',
          'story',
        ];
        const successTexts: any = {};

        // 병렬 처리: 모든 원칙을 동시에 생성
        const generateText = async (principle: string, index: number) => {
          try {
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

            // 완료되는 순서대로 즉시 SSE로 전송
            const data = JSON.stringify({
              principle,
              text: successTexts[principle],
              completed: Object.keys(successTexts).length,
              total: principles.length,
              cached: false,
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            return { principle, text: successTexts[principle], index };
          } catch (error) {
            // 에러 시에도 기본값으로 전송
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

            const data = JSON.stringify({
              principle,
              text: successTexts[principle],
              completed: Object.keys(successTexts).length,
              total: principles.length,
              cached: false,
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            return { principle, text: successTexts[principle], index };
          }
        };

        // 모든 원칙을 병렬로 생성
        const promises = principles.map((principle, index) =>
          generateText(principle, index)
        );

        // 모든 Promise가 완료될 때까지 대기
        await Promise.all(promises);

        // 3. DB에 캐시 저장
        try {
          await saveMarketingTextCache({
            cache_key: cacheKey,
            url: url,
            concept_name: conceptName,
            simple: successTexts.simple,
            unexpected: successTexts.unexpected,
            concrete: successTexts.concrete,
            credible: successTexts.credible,
            emotional: successTexts.emotional,
            story: successTexts.story,
          });
        } catch (error) {}

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate SUCCESs marketing texts' },
      { status: 500 }
    );
  }
}
