'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useFunnelStore, ProductSummary } from '@/lib/store';
import { isValidUrl } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import ProgressBar from '@/components/ProgressBar';
import LoginModal from '@/components/auth/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import { useCreditStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';

export default function HomePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const tHome = useTranslations('home');
  const tSteps = useTranslations('steps');
  const tCommon = useTranslations('common');
  
  const { url, setUrl, setSummary } = useFunnelStore();
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = useAuthStore();

  const { credits, fetchCredits, updateCredits } = useCreditStore();

  const stepNames = [
    tSteps('linkInput'),
    tSteps('productSummary'),
    tSteps('messageType'),
    tSteps('expressionStyle'),
    tSteps('toneMood'),
    tSteps('modelComposition'),
    tSteps('aspectRatio'),
    tSteps('imageUpload'),
    tSteps('editor'),
    tSteps('result'),
  ];

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputUrl.trim()) {
      setError(tHome('errorEmptyUrl'));
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError(tHome('errorInvalidUrl'));
      return;
    }

    // 크레딧 확인 (0이면 모달 표시)
    if (credits !== null && credits <= 0) {
      setShowPaymentModal(true);
      return;
    }

    await executeSubmit(inputUrl);
  };

  const executeSubmit = async (targetUrl: string) => {
    setLoading(true);
    setUrl(targetUrl);

    try {
      console.log('🌐 [HomePage] Sending to API:', { url: inputUrl, locale });
      
      // API 호출하여 제품 요약 생성
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 402 Payment Required: 크레딧 부족
        if (response.status === 402) {
          setShowLoginModal(true);
          setLoading(false);
          return;
        }

        // 에러 타입별 처리
        if (response.status === 403 && errorData.error === 'BOT_BLOCKED') {
          alert(tHome('errorBotBlocked'));
          router.push(`/${locale}/summary?manual=true`);
          return;
        }

        if (response.status === 500 && errorData.error === 'SERVER_ERROR') {
          if (confirm(tHome('errorServerRetry'))) {
            // 재시도 로직
            executeSubmit(targetUrl);
            return;
          }
          setError(errorData.message || tHome('errorServer'));
          return;
        }

        throw new Error(errorData.message || tHome('errorAnalysisFailed'));
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
        category: data.category,
      };
      setSummary(summaryData);

      // 이벤트 추적
      trackEvent('link_submit', {
        step: 1,
        page: 'home',
        locale,
      });

      // 제품 요약 페이지로 이동
      router.push(`/${locale}/summary`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tHome('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleStepClick = (stepNumber: number) => {
    const stepRoutes: Record<number, string> = {
      1: `/${locale}`,
      2: `/${locale}/summary`,
      3: `/${locale}/styles/messages`,
      4: `/${locale}/styles/expressions`,
      5: `/${locale}/styles/tones-moods`,
      6: `/${locale}/styles/models`,
      7: `/${locale}/styles/aspect-ratio`,
      8: `/${locale}/upload`,
      9: `/${locale}/editor`,
      10: `/${locale}/result`,
    };
    
    const route = stepRoutes[stepNumber];
    if (route && route !== window.location.pathname) {
      router.push(route);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <ProgressBar 
        currentStep={1} 
        totalSteps={10} 
        stepNames={stepNames}
        onStepClick={handleStepClick}
      />

      <div className="container mx-auto px-4 pb-12 md:py-12">
        <div className="max-w-2xl mx-auto text-center">
          {/* 헤더 */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{tCommon('appName')}</h1>
            <p className="text-xl text-gray-600 mb-2">{tCommon('appTagline')}</p>
            <p className="text-gray-500">
              {tHome('subtitle')}
              <br />
              {tHome('description')}
            </p>
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {tHome('inputLabel')}
              </label>
              <input
                type="url"
                id="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder={tHome('inputPlaceholder')}
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
              {loading ? tHome('analyzing') : tHome('submitButton')}
            </Button>
          </form>

          {/* HYP 핵심 과정 섹션 */}
          <ProcessSection />

          {/* 사용 예시 섹션 */}
          <ExampleSection />

          {/* 하단 CTA 버튼 */}
          <ScrollToTopButton />
        </div>
      </div>

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        isLoggedIn={!!user}
        onSuccess={() => {
          // 충전 완료 간주 -> 크레딧 상태 업데이트 (낙관적 + 서버 동기화)
          updateCredits((credits || 0) + 100);
          fetchCredits();

          // 분석 시작 (비동기 상태 업데이트 고려하여 setTimeout 사용)
          setTimeout(() => executeSubmit(inputUrl), 0);
        }}
      />
    </div>
  );
}

// 스크롤 탑 버튼 컴포넌트
function ScrollToTopButton() {
  const tHome = useTranslations('home');
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="text-center pb-12 pt-6">
      <Button
        onClick={scrollToTop}
        size="lg"
        className="px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
      >
        {tHome('ctaButton')}
      </Button>
    </div>
  );
}

// HYP 핵심 과정 섹션 컴포넌트
function ProcessSection() {
  const tHome = useTranslations('home');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // 데스크톱 애니메이션: 순서대로 강조 (반복)
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => {
        return (prev + 1) % 3;
      });
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const processImages = [
    '/images/process-examples/process-1.png',
    '/images/process-examples/process-2.png',
    '/images/process-examples/process-3.png',
  ];

  const processSteps = [
    tHome('processStep1'),
    tHome('processStep2'),
    tHome('processStep3'),
  ];

  return (
    <div className="pt-12 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 pb-4 text-center">
        {tHome('processTitle')}
      </h3>
      {/* 데스크톱: 가로 1열 */}
      <div className="hidden md:flex justify-center items-center gap-6">
        {processImages.map((src, index) => {
          const isHighlighted = highlightedIndex === index;
          const isDimmed = !isHighlighted;
          const isLowBrightness = highlightedIndex === 1 && index === 2;

          return (
            <div key={index}>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {processSteps[index]}
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
                  alt={`HYP ${processSteps[index]}`}
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
            <p className="text-sm font-medium text-gray-700 mb-2">
              {processSteps[index]}
            </p>
            <ProcessImageMobile src={src} index={index} stepLabel={processSteps[index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 모바일용 이미지 컴포넌트
function ProcessImageMobile({ src, index, stepLabel }: { src: string; index: number; stepLabel: string }) {
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
        alt={`HYP ${stepLabel}`}
        width={200}
        height={200}
        className="w-full h-auto p-4"
        priority={index === 0}
      />
    </motion.div>
  );
}

// 사용 예시 섹션 컴포넌트
function ExampleSection() {
  const tHome = useTranslations('home');
  
  const examples = [
    {
      src: '/images/result-examples/result1-youtube.png',
      title: tHome('example1Title'),
      description1: tHome('example1Desc1'),
      description2: tHome('example1Desc2'),
      align: 'left',
      device: 'desktop',
    },
    {
      src: '/images/result-examples/result2-macbook.png',
      title: tHome('example2Title'),
      description1: tHome('example2Desc1'),
      description2: tHome('example2Desc2'),
      align: 'right',
      device: 'desktop',
    },
    {
      src: '/images/result-examples/result3-musinsa.png',
      title: tHome('example3Title'),
      description1: tHome('example3Desc1'),
      description2: tHome('example3Desc2'),
      align: 'left',
      device: 'mobile',
    },
  ];

  return (
    <div className="py-6 md:pt-12 md:pb-6 border-t border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 pb-8 text-center">
        {tHome('exampleTitle')}
      </h3>

      <div className="flex flex-col gap-16 max-w-4xl mx-auto px-4">
        {examples.map((example, index) => (
          <div
            key={index}
            className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${
              example.align === 'right' ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* 이미지 영역 */}
            <div
              className={`w-full ${
                example.device === 'mobile' ? 'md:w-1/2' : 'md:w-full'
              }`}
            >
              <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white border border-gray-100">
                <Image
                  src={example.src}
                  alt={`${tHome('exampleCase')} ${index + 1}`}
                  width={400}
                  height={500}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* 텍스트 영역 */}
            <div
              className={`w-full md:w-1/2 flex flex-col ${
                example.align === 'right'
                  ? 'md:items-end md:text-right'
                  : 'md:items-start md:text-left'
              } items-center text-center`}
            >
              <span className="text-blue-600 font-bold text-lg tracking-wider mb-2">
                {tHome('exampleCase')} {index + 1}. {example.title}
              </span>
              <p className="text-gray-800 font-bold text-md md:text-lg leading-tight">
                {example.description1},
                <br />
                {example.description2}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
