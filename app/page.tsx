'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, useInView, useAnimation } from 'framer-motion';
import { useFunnelStore, ProductSummary } from '@/lib/store';
import { isValidUrl } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';

const stepNames = [
  '링크 입력',
  '제품 요약',
  '컨셉 선택',
  '이미지 업로드',
  '에디터',
  '결과',
];

export default function HomePage() {
  const router = useRouter();
  const { url, setUrl, setSummary } = useFunnelStore();
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputUrl.trim()) {
      setError('링크를 입력해주세요.');
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError('올바른 URL 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    setUrl(inputUrl);

    try {
      // API 호출하여 제품 요약 생성
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 에러 타입별 처리
        if (response.status === 403 && errorData.error === 'BOT_BLOCKED') {
          alert(
            '이 사이트의 보안 정책으로 인해 자동 분석이 불가능합니다. 직접 입력해주세요.'
          );
          router.push('/summary?manual=true');
          return;
        }

        if (response.status === 500 && errorData.error === 'SERVER_ERROR') {
          if (
            confirm(
              '서버에 일시적인 문제가 발생했습니다. 다시 시도하시겠습니까?'
            )
          ) {
            // 재시도 로직
            handleSubmit(e);
            return;
          }
          setError(errorData.message || '서버 오류가 발생했습니다.');
          return;
        }

        throw new Error(errorData.message || '제품 분석에 실패했습니다.');
      }

      const data = await response.json();

      // Zustand 스토어에 제품 요약 데이터 저장
      const summaryData: ProductSummary = {
        id: data.id,
        url: inputUrl,
        title: data.title,
        core_value: data.core_value,
        target_customer: data.target_customer,
        competitive_edge: data.competitive_edge,
        customer_benefit: data.customer_benefit,
        emotional_keyword: data.emotional_keyword,
        feature_summary: data.feature_summary,
        usage_scenario: data.usage_scenario,
        category: data.category, // ✅ category 필드 추가
      };
      setSummary(summaryData);

      // 이벤트 추적
      trackEvent('link_submit', {
        step: 1,
        page: 'home',
      });

      // 제품 요약 페이지로 이동
      router.push('/summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar currentStep={1} totalSteps={6} stepNames={stepNames} />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">HYP</h1>
            <p className="text-xl text-gray-600 mb-2">Highlight Your Product</p>
            <p className="text-gray-500">
              AI가 제안하고, 당신이 선택해 완성합니다.
              <br />단 몇 초 만에 홍보 콘텐츠를 만들어보세요.
            </p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                아래에 서비스나 제품 설명 페이지의 링크를 입력해보세요 👇
              </label>
              <input
                type="url"
                id="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                disabled={loading}
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              disabled={!inputUrl.trim()}
              className="w-full"
            >
              {loading ? '제품을 분석하고 있습니다...' : '홍보 콘텐츠 만들기'}
            </Button>
          </form>

          {/* HYP 핵심 과정 섹션 */}
          <ProcessSection />

          {/* 예시 */}
          <div className="mt-12 p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              추천하는 링크 유형
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                • 웹서비스{' '}
                <span className="text-gray-400">
                  ex) https://www.figma.com/ko-kr/
                </span>
              </p>
              <p>
                • 제품 설명 및 기능 페이지{' '}
                <span className="text-gray-400">
                  ex) https://www.apple.com/kr/macbook-air/
                </span>
              </p>
            </div>
            <div className="mt-4 p-3   rounded-md">
              <p className="text-xs text-yellow-800">
                ⚠️ 사이트의 보안 정책에 따라 일부 웹페이지는 분석이 제한될 수
                있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// HYP 핵심 과정 섹션 컴포넌트
function ProcessSection() {
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // 데스크톱 애니메이션: 순서대로 강조 (반복)
  // 순서: 0(1) 밝음 → 1(2) 밝음 → 2(3) 밝음 → 반복
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => {
        return (prev + 1) % 3;
      });
    }, 1600); // 각 단계당 0.8초 * 2 = 1.6초

    return () => clearInterval(interval);
  }, []);

  const processImages = [
    '/images/process-examples/process-1.png',
    '/images/process-examples/process-2.png',
    '/images/process-examples/process-3.png',
  ];

  return (
    <div className="pt-12 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 pb-4 text-center">
        1분 이내에 홍보 콘텐츠 생성하는 방법 👀
      </h3>
      {/* 데스크톱: 가로 1열 */}
      <div className="hidden md:flex justify-center items-center gap-6">
        {processImages.map((src, index) => {
          const isHighlighted = highlightedIndex === index;
          // 강조 로직:
          // - highlightedIndex === 0: index 0 밝음, 1,2 흐림
          // - highlightedIndex === 1: index 1 밝음, 0,2 흐림 (2는 낮게)
          // - highlightedIndex === 2: index 2 밝음, 0,1 흐림
          const isDimmed = !isHighlighted;
          const isLowBrightness = highlightedIndex === 1 && index === 2; // 2 밝음일 때 3은 낮게

          return (
            <div key={index}>
              <p className="text-sm font-medium text-gray-700">
                {['1. 링크 입력', '2. 스타일 선택', '3. 콘텐츠 생성'][index]}
              </p>
              <motion.div
                key={index}
                className="relative rounded-lg overflow-hidden"
                animate={{
                  scale: isHighlighted ? 1.03 : 1,
                  opacity: isLowBrightness ? 0.7 : isDimmed ? 0.5 : 1,
                  filter: isLowBrightness
                    ? 'brightness(0.8)'
                    : isDimmed
                    ? 'brightness(0.6)'
                    : 'brightness(1.1)',
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeInOut',
                }}
                style={{
                  boxShadow: isHighlighted
                    ? '0 10px 40px rgba(0, 0, 0, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Image
                  src={src}
                  alt={`HYP 과정 ${index + 1}`}
                  priority={index === 0}
                  width={200}
                  height={200}
                  className="w-full h-auto p-2"
                />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* 모바일: 세로 */}
      <div className="md:hidden space-y-6">
        {processImages.map((src, index) => (
          <div key={index}>
            <p className="text-sm font-medium text-gray-700">
              {['1. 링크 입력', '2. 스타일 선택', '3. 콘텐츠 생성'][index]}
            </p>
            <ProcessImageMobile src={src} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 모바일용 이미지 컴포넌트
function ProcessImageMobile({ src, index }: { src: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 1 }}
      animate={
        isInView
          ? {
              opacity: 1,
              scale: 1.03,
            }
          : { opacity: 0, scale: 1 }
      }
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative rounded-lg overflow-hidden"
    >
      <Image
        src={src}
        alt={`HYP 과정 ${index + 1}`}
        width={200}
        height={200}
        className="w-full h-auto p-4"
        priority={index === 0}
      />
    </motion.div>
  );
}
